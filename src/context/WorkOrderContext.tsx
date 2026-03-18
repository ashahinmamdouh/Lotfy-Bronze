import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, query, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useFirebase } from './FirebaseContext';

export const formatFullName = (wo: any) => {
  if (wo.fullName && wo.fullName.includes(' - ')) {
    return wo.fullName;
  }
  
  const hasFraction = /\d+\/\d+/.test(wo.id || '');
  
  return [
    wo.id,
    hasFraction ? null : '1/1',
    wo.productType || 'Bars',
    wo.material?.split(' ')[0],
    wo.dimensions?.replace(/OD:\s*([^,]+),\s*ID:\s*([^,]+),\s*L:\s*([^,]+)/, '$1x$2x$3 mm') || wo.dimensions,
    `Qty:${wo.qty || '1'}`
  ].filter(part => part && part.toString().trim() !== '').join(' - ');
};

export interface WorkOrder {
  id: string;
  material: string;
  process: string;
  dimensions: string;
  qty: number;
  weight: number;
  stage: string;
  workshop: string;
  start: string;
  due: string;
  priority: string;
  status: string;
  stages: { name: string; status: 'completed' | 'current' | 'pending'; workshop?: string; reworkCount?: number }[];
  createdAt?: string;
  actualWeight?: number;
  deliveryDate?: string;
  completionDate?: string;
  qualityStatus?: string;
  aptDate?: string;
  productType?: string;
  authorId?: string;
  routeId?: string;
  woDate?: string;
  fullName?: string;
  moldNo?: string;
  sequence?: number;
}

interface WorkOrderContextType {
  orders: WorkOrder[];
  addOrders: (newOrders: any[]) => Promise<void>;
  updateOrder: (id: string, updatedData: Partial<WorkOrder>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  deleteMultipleOrders: (ids: string[]) => Promise<void>;
}

export const WorkOrderContext = createContext<WorkOrderContextType | null>(null);

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, user: any) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: user?.uid,
      email: user?.email,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const WorkOrderProvider = ({ children }: { children: React.ReactNode }) => {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const { user, isAuthReady } = useFirebase();

  useEffect(() => {
    if (!isAuthReady || !user) {
      setOrders([]);
      return;
    }

    const q = query(collection(db, 'workOrders'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders: WorkOrder[] = [];
      snapshot.forEach((doc) => {
        fetchedOrders.push({ id: doc.id, ...doc.data() } as WorkOrder);
      });
      setOrders(fetchedOrders);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'workOrders', user);
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  const addOrders = async (newOrders: any[]) => {
    if (!user) return;

    try {
      // Fetch routing and workshop master data to populate stages correctly
      const [routingSnap, workshopsSnap] = await Promise.all([
        getDocs(collection(db, 'master_routing')),
        getDocs(collection(db, 'master_workshops'))
      ]);

      const allRouting: any[] = [];
      routingSnap.forEach(doc => allRouting.push({ id: doc.id, ...doc.data() }));

      const allWorkshops: any[] = [];
      workshopsSnap.forEach(doc => allWorkshops.push({ id: doc.id, ...doc.data() }));

      const formattedOrders = newOrders.map(order => {
        // Find all routing stages that match the process type of the order
        const orderRouting = allRouting
          .filter(r => r.processType === order.process)
          .sort((a, b) => Number(a.stageNo) - Number(b.stageNo));

        const stages = orderRouting.length > 0 
          ? orderRouting.map((r, idx) => {
              // Try to find a workshop that matches the routing's workshopId
              const matchedWorkshop = allWorkshops.find(w => 
                w.name?.trim().toLowerCase() === r.workshopId?.trim().toLowerCase() ||
                w.stageName?.trim().toLowerCase() === r.workshopId?.trim().toLowerCase()
              );

              return {
                name: r.stageName || r.processType || 'Unknown Stage',
                status: idx === 0 ? 'current' : 'pending' as 'completed' | 'current' | 'pending',
                workshop: matchedWorkshop ? matchedWorkshop.name : (r.workshopId || 'Unassigned')
              };
            })
          : [
              { name: 'Material Prep', status: 'current' as const, workshop: allWorkshops.find(w => w.name.includes('Foundry'))?.name || 'Foundry A' },
              { name: 'Furnace Melting', status: 'pending' as const, workshop: allWorkshops.find(w => w.name.includes('Foundry'))?.name || 'Foundry A' },
              { name: order.process || 'Casting', status: 'pending' as const, workshop: allWorkshops.find(w => w.name.includes('Foundry'))?.name || 'Foundry A' },
              { name: 'Cooling', status: 'pending' as const, workshop: allWorkshops.find(w => w.name.includes('Foundry'))?.name || 'Foundry A' },
              { name: 'Rough Machining', status: 'pending' as const, workshop: allWorkshops.find(w => w.name.includes('Machining'))?.name || 'Machining Workshop' },
              { name: 'Final Machining', status: 'pending' as const, workshop: allWorkshops.find(w => w.name.includes('Machining'))?.name || 'Machining Workshop' },
              { name: 'Inspection', status: 'pending' as const, workshop: allWorkshops.find(w => w.name.includes('Quality'))?.name || 'Quality Workshop' },
            ];

        // Generate Full Name: WO No - Line - Product - Material - Dimensions - Qty
        const hasFraction = /\d+\/\d+/.test(order.id || '');
        const fullName = order.fullName || [
          order.id,
          hasFraction ? null : '1/1', // Default line number if not provided
          order.productType || 'Bars',
          order.material?.split(' ')[0],
          order.dimensions,
          `Qty:${order.qty || '1'}`
        ].filter(part => part && part.toString().trim() !== '').join(' - ');

        return {
          ...order,
          authorId: user.uid,
          stages,
          stage: stages[0].name,
          workshop: stages[0].workshop, // Set top-level workshop for better filtering
          fullName,
          moldNo: order.moldNo || order.mold || ''
        };
      });

      const batch = writeBatch(db);
      for (const order of formattedOrders) {
        const docRef = doc(db, 'workOrders', order.id);
        batch.set(docRef, order);
      }
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'workOrders', user);
    }
  };

  const updateOrder = async (id: string, updatedData: Partial<WorkOrder>) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'workOrders', id), updatedData, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'workOrders', user);
    }
  };

  const deleteOrder = async (id: string) => {
    if (!user) return;
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'workOrders', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'workOrders', user);
    }
  };

  const deleteMultipleOrders = async (ids: string[]) => {
    if (!user || ids.length === 0) return;
    try {
      const batch = writeBatch(db);
      ids.forEach(id => {
        batch.delete(doc(db, 'workOrders', id));
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'workOrders', user);
    }
  };

  return (
    <WorkOrderContext.Provider value={{ orders, addOrders, updateOrder, deleteOrder, deleteMultipleOrders }}>
      {children}
    </WorkOrderContext.Provider>
  );
};

export const useWorkOrders = () => {
  const context = useContext(WorkOrderContext);
  if (!context) {
    throw new Error('useWorkOrders must be used within a WorkOrderProvider');
  }
  return context;
};
