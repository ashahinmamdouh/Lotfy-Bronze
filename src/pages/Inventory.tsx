import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Package } from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { useMasterData } from '../context/MasterDataContext';
import { collection, onSnapshot, query, orderBy, doc, setDoc, deleteDoc, addDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { DataTable, Column } from '../components/DataTable';

const tabs = [
  { name: 'Raw Materials', path: 'raw' },
  { name: 'FG Products', path: 'fg' },
  { name: 'WIP Product', path: 'wip-product' },
  { name: 'WIP Raw Material', path: 'wip-raw' },
  { name: 'Issue Request', path: 'issue' },
];

const inventoryColumns: Column[] = [
  { header: 'Code', accessor: 'code' },
  { header: 'Name', accessor: 'name' },
  { header: 'Family', accessor: 'family' },
  { header: 'Unit', accessor: 'unit' },
  { header: 'Total Qty', accessor: 'qty' },
  { header: 'Reserved', accessor: 'reserved' },
  { header: 'Available', accessor: 'available' },
];

const productInventoryColumns: Column[] = [
  { header: 'Code', accessor: 'code' },
  { header: 'Name', accessor: 'name' },
  { header: 'Family', accessor: 'family' },
  { header: 'OD (mm)', accessor: 'od' },
  { header: 'ID (mm)', accessor: 'id' },
  { header: 'Length (mm)', accessor: 'length' },
  { header: 'Unit', accessor: 'unit' },
  { header: 'Total Qty', accessor: 'qty' },
  { header: 'Reserved', accessor: 'reserved' },
  { header: 'Available', accessor: 'available' },
];

const issueRequestColumns: Column[] = [
  { header: 'Request ID', accessor: 'id' },
  { header: 'Date', accessor: 'date' },
  { header: 'Material Code', accessor: 'materialCode' },
  { header: 'Quantity', accessor: 'qty' },
  { header: 'Workshop', accessor: 'workshop' },
  { header: 'Status', accessor: 'status' },
];

function InventoryTab({ collectionName, columns, title }: { collectionName: string, columns: Column[], title: string }) {
  const [data, setData] = useState<any[]>([]);
  const { user, isAuthReady } = useFirebase();
  const { materials, products } = useMasterData();

  useEffect(() => {
    if (!isAuthReady || !user) return;

    const q = query(collection(db, collectionName));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records: any[] = [];
      snapshot.forEach((doc) => {
        records.push({ _id: doc.id, ...doc.data() });
      });
      setData(records);
    }, (error) => {
      console.error(`Error fetching ${collectionName}:`, error);
    });

    return () => unsubscribe();
  }, [isAuthReady, user, collectionName]);

  const dynamicColumns = columns.map(col => {
    if (col.accessor === 'name') {
      const options = collectionName.includes('fg') || collectionName.includes('wip-product')
        ? products.map(p => p.type)
        : materials.map(m => m.name);
      return { ...col, options: Array.from(new Set(options)) };
    }
    if (col.accessor === 'family') {
      const options = collectionName.includes('fg') || collectionName.includes('wip-product')
        ? ['Finished Goods', 'Product']
        : materials.map(m => m.family);
      return { ...col, options: Array.from(new Set(options.filter(Boolean))) };
    }
    return col;
  });

  const handleFieldChange = (accessor: string, value: string, currentData: any) => {
    if (accessor === 'name') {
      if (collectionName.includes('fg') || collectionName.includes('wip-product')) {
        const product = products.find(p => p.type === value);
        if (product) {
          return { ...currentData, family: 'Finished Goods' };
        }
      } else {
        const material = materials.find(m => m.name === value);
        if (material) {
          return {
            ...currentData,
            code: material.code || currentData.code,
            family: material.family || currentData.family
          };
        }
      }
    }
    return currentData;
  };

  const handleAdd = async (item: any) => {
    if (!user) return;
    const available = (Number(item.qty) || 0) - (Number(item.reserved) || 0);
    await addDoc(collection(db, collectionName), {
      ...item,
      available,
      authorId: user.uid,
      createdAt: new Date().toISOString()
    });
  };

  const handleAddMultiple = async (items: any[]) => {
    if (!user) return;
    const batch = writeBatch(db);
    items.forEach(item => {
      const docRef = doc(collection(db, collectionName));
      const available = (Number(item.qty) || 0) - (Number(item.reserved) || 0);
      batch.set(docRef, {
        ...item,
        available,
        authorId: user.uid,
        createdAt: new Date().toISOString()
      });
    });
    await batch.commit();
  };

  const handleEdit = async (item: any) => {
    if (!user || !item._id) return;
    const { _id, ...dataToUpdate } = item;
    const available = (Number(dataToUpdate.qty) || 0) - (Number(dataToUpdate.reserved) || 0);
    await setDoc(doc(db, collectionName, _id), {
      ...dataToUpdate,
      available,
      authorId: user.uid
    }, { merge: true });
  };

  const handleDelete = async (item: any) => {
    if (!user || !item._id) return;
    await deleteDoc(doc(db, collectionName, item._id));
  };

  return (
    <DataTable 
      columns={dynamicColumns} 
      data={data} 
      onAdd={handleAdd} 
      onAddMultiple={handleAddMultiple} 
      onEdit={handleEdit} 
      onDelete={handleDelete} 
      onFieldChange={handleFieldChange}
      searchPlaceholder={`Search ${title}...`} 
      exportFileName={title} 
    />
  );
}

export default function Inventory() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <p className="mt-1 text-sm text-gray-500">Track raw materials, WIP, and finished goods.</p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => (
              <NavLink
                key={tab.name}
                to={`/inventory/${tab.path}`}
                className={({ isActive }) =>
                  cn(
                    isActive
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                    'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
                  )
                }
              >
                {tab.name}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="p-6">
          <Routes>
            <Route path="/" element={<Navigate to="raw" replace />} />
            <Route path="raw" element={<InventoryTab collectionName="inventory_raw" columns={inventoryColumns} title="Raw Materials" />} />
            <Route path="fg" element={<InventoryTab collectionName="inventory_fg" columns={productInventoryColumns} title="Finished Goods" />} />
            <Route path="wip-product" element={<InventoryTab collectionName="inventory_wip_product" columns={productInventoryColumns} title="WIP Product" />} />
            <Route path="wip-raw" element={<InventoryTab collectionName="inventory_wip_raw" columns={inventoryColumns} title="WIP Raw Material" />} />
            <Route path="issue" element={<InventoryTab collectionName="inventory_issue" columns={issueRequestColumns} title="Issue Request" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
