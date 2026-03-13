import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Package, Search, Plus, X } from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const tabs = [
  { name: 'Raw Materials', path: 'raw' },
  { name: 'FG Products', path: 'fg' },
  { name: 'WIP Product', path: 'wip-product' },
  { name: 'WIP Raw Material', path: 'wip-raw' },
  { name: 'Issue Request', path: 'issue' },
];

function RawMaterials() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { user, isAuthReady } = useFirebase();

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    family: 'Raw Material',
    unit: 'kg',
    qty: 0,
    reserved: 0
  });

  useEffect(() => {
    if (!isAuthReady || !user) return;

    const q = query(collection(db, 'inventory_records'), orderBy('code'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records: any[] = [];
      snapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() });
      });
      setRecords(records);
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  const setRecords = (records: any[]) => {
    setInventory(records);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await addDoc(collection(db, 'inventory_records'), {
        ...formData,
        available: formData.qty - formData.reserved,
        authorId: user.uid,
        createdAt: new Date().toISOString()
      });
      setShowAddModal(false);
      setFormData({ code: '', name: '', family: 'Raw Material', unit: 'kg', qty: 0, reserved: 0 });
    } catch (error) {
      console.error('Error adding inventory:', error);
      alert('Failed to add inventory record.');
    }
  };

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Search inventory..."
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Receive Material
          </button>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Family</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Qty</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Reserved</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInventory.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.family}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{item.qty} {item.unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-yellow-600">{item.reserved} {item.unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">{item.available} {item.unit}</td>
                    </tr>
                  ))}
                  {filteredInventory.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No inventory records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Receive Material</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Code</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={e => setFormData({...formData, code: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.qty}
                    onChange={e => setFormData({...formData, qty: Number(e.target.value)})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unit</label>
                  <input
                    type="text"
                    required
                    value={formData.unit}
                    onChange={e => setFormData({...formData, unit: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function PlaceholderTab({ title }: { title: string }) {
  return (
    <div className="py-12 text-center">
      <Package className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">This module is under construction.</p>
    </div>
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
            <Route path="raw" element={<RawMaterials />} />
            <Route path="fg" element={<PlaceholderTab title="Finished Goods" />} />
            <Route path="wip-product" element={<PlaceholderTab title="WIP Product" />} />
            <Route path="wip-raw" element={<PlaceholderTab title="WIP Raw Material" />} />
            <Route path="issue" element={<PlaceholderTab title="Issue Request" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
