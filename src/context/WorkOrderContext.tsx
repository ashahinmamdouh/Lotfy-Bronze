import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, query } from 'firebase/firestore';
import { db } from '../firebase';
import { useFirebase } from './FirebaseContext';

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
  stages: { name: string; status: 'completed' | 'current' | 'pending' }[];
  createdAt?: string;
  actualWeight?: number;
  deliveryDate?: string;
  completionDate?: string;
  qualityStatus?: string;
  aptDate?: string;
  productType?: string;
  authorId?: string;
}

interface WorkOrderContextType {
  orders: WorkOrder[];
  addOrders: (newOrders: any[]) => Promise<void>;
  updateOrder: (id: string, updatedData: Partial<WorkOrder>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
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

    const formattedOrders = newOrders.map(order => ({
      ...order,
      authorId: user.uid,
      stages: [
        { name: 'Material Prep', status: 'current' },
        { name: 'Furnace Melting', status: 'pending' },
        { name: order.process || 'Casting', status: 'pending' },
        { name: 'Cooling', status: 'pending' },
        { name: 'Rough Machining', status: 'pending' },
        { name: 'Final Machining', status: 'pending' },
        { name: 'Inspection', status: 'pending' },
      ]
    }));

    try {
      for (const order of formattedOrders) {
        await setDoc(doc(db, 'workOrders', order.id), order);
      }
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

  return (
    <WorkOrderContext.Provider value={{ orders, addOrders, updateOrder, deleteOrder }}>
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
