import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useFirebase } from './FirebaseContext';

interface MasterDataContextType {
  materials: any[];
  products: any[];
  processes: any[];
  status: any[];
  workshops: any[];
  operators: any[];
  machines: any[];
  molds: any[];
  routing: any[];
  rejections: any[];
  castingTypes: any[];
  
  addMasterData: (collectionName: string, item: any) => Promise<void>;
  addMultipleMasterData: (collectionName: string, items: any[]) => Promise<void>;
  updateMasterData: (collectionName: string, id: string, item: any) => Promise<void>;
  deleteMasterData: (collectionName: string, id: string) => Promise<void>;
}

export const MasterDataContext = createContext<MasterDataContextType | null>(null);

export const MasterDataProvider = ({ children }: { children: React.ReactNode }) => {
  const [materials, setMaterials] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [processes, setProcesses] = useState<any[]>([]);
  const [status, setStatus] = useState<any[]>([]);
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [operators, setOperators] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [molds, setMolds] = useState<any[]>([]);
  const [routing, setRouting] = useState<any[]>([]);
  const [rejections, setRejections] = useState<any[]>([]);
  const [castingTypes, setCastingTypes] = useState<any[]>([]);

  const { user, isAuthReady } = useFirebase();

  useEffect(() => {
    if (!isAuthReady || !user) {
      setMaterials([]);
      setProducts([]);
      setProcesses([]);
      setStatus([]);
      setWorkshops([]);
      setOperators([]);
      setMachines([]);
      setMolds([]);
      setRouting([]);
      setRejections([]);
      setCastingTypes([]);
      return;
    }

    const collections = [
      { name: 'master_materials', setter: setMaterials },
      { name: 'master_products', setter: setProducts },
      { name: 'master_processes', setter: setProcesses },
      { name: 'master_status', setter: setStatus },
      { name: 'master_workshops', setter: setWorkshops },
      { name: 'master_operators', setter: setOperators },
      { name: 'master_machines', setter: setMachines },
      { name: 'master_molds', setter: setMolds },
      { name: 'master_routing', setter: setRouting },
      { name: 'master_rejections', setter: setRejections },
      { name: 'master_casting_types', setter: setCastingTypes },
    ];

    const unsubscribes = collections.map(({ name, setter }) => {
      const q = query(collection(db, name));
      return onSnapshot(q, (snapshot) => {
        const data: any[] = [];
        snapshot.forEach((doc) => {
          data.push({ _id: doc.id, ...doc.data() });
        });
        setter(data);
      }, (error) => {
        console.error(`Error fetching ${name}:`, error);
      });
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [user, isAuthReady]);

  const addMasterData = async (collectionName: string, item: any) => {
    if (!user) return;
    try {
      const docRef = doc(collection(db, collectionName));
      await setDoc(docRef, { ...item, authorId: user.uid });
    } catch (error) {
      console.error(`Error adding to ${collectionName}:`, error);
      throw error;
    }
  };

  const addMultipleMasterData = async (collectionName: string, items: any[]) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      items.forEach(item => {
        const docRef = doc(collection(db, collectionName));
        batch.set(docRef, { ...item, authorId: user.uid });
      });
      await batch.commit();
    } catch (error) {
      console.error(`Error adding multiple to ${collectionName}:`, error);
      throw error;
    }
  };

  const updateMasterData = async (collectionName: string, id: string, item: any) => {
    if (!user) return;
    try {
      const { _id, ...dataToUpdate } = item;
      await setDoc(doc(db, collectionName, id), { ...dataToUpdate, authorId: user.uid }, { merge: true });
    } catch (error) {
      console.error(`Error updating ${collectionName}:`, error);
      throw error;
    }
  };

  const deleteMasterData = async (collectionName: string, id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
      console.error(`Error deleting from ${collectionName}:`, error);
      throw error;
    }
  };

  return (
    <MasterDataContext.Provider value={{
      materials, products, processes, status, workshops, operators, machines, molds, routing, rejections, castingTypes,
      addMasterData, addMultipleMasterData, updateMasterData, deleteMasterData
    }}>
      {children}
    </MasterDataContext.Provider>
  );
};

export const useMasterData = () => {
  const context = useContext(MasterDataContext);
  if (!context) {
    throw new Error('useMasterData must be used within a MasterDataProvider');
  }
  return context;
};
