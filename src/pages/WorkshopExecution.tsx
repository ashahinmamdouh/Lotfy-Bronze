import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Factory, Play, Square, Save } from 'lucide-react';
import { useWorkOrders } from '../context/WorkOrderContext';
import { useFirebase } from '../context/FirebaseContext';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const tabs = [
  { name: 'Workshop Record', path: 'record' },
  { name: 'Workshop History', path: 'history' },
];

function WorkshopRecord() {
  const { orders } = useWorkOrders();
  const { user } = useFirebase();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    priority: '1',
    workshop: 'Foundry A',
    machine: 'Furnace F-01',
    workorder: 'none',
    operator: 'Ahmed Hassan',
    status: 'Under Process',
    startTime: '',
    endTime: '',
    duration: '',
    qtyProduced: '',
    qtyScrap: '',
    remarks: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await addDoc(collection(db, 'workshop_records'), {
        ...formData,
        authorId: user.uid,
        createdAt: new Date().toISOString()
      });
      alert('Record saved successfully!');
      // Reset form
      setFormData({
        ...formData,
        startTime: '',
        endTime: '',
        duration: '',
        qtyProduced: '',
        qtyScrap: '',
        remarks: ''
      });
    } catch (error) {
      console.error('Error saving record:', error);
      alert('Failed to save record.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200">
        <div className="space-y-8 divide-y divide-gray-200">
          <div>
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">New Workshop Task Record</h3>
              <p className="mt-1 text-sm text-gray-500">
                Log production activities, machine time, and material usage.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
                <div className="mt-1">
                  <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
                <div className="mt-1">
                  <select id="priority" name="priority" value={formData.priority} onChange={handleChange} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                    <option value="1">1 - Normal</option>
                    <option value="2">2 - High</option>
                    <option value="3">3 - Urgent</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="workshop" className="block text-sm font-medium text-gray-700">Workshop Name</label>
                <div className="mt-1">
                  <select id="workshop" name="workshop" value={formData.workshop} onChange={handleChange} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                    <option>Foundry A</option>
                    <option>Foundry B</option>
                    <option>Machining Shop</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="machine" className="block text-sm font-medium text-gray-700">Machine</label>
                <div className="mt-1">
                  <select id="machine" name="machine" value={formData.machine} onChange={handleChange} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                    <option>Furnace F-01</option>
                    <option>Centrifugal C-02</option>
                    <option>Lathe L-05</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="workorder" className="block text-sm font-medium text-gray-700">Work Order</label>
                <div className="mt-1">
                  <select id="workorder" name="workorder" value={formData.workorder} onChange={handleChange} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                    {orders.map(wo => (
                      <option key={wo.id} value={wo.id}>{wo.id} - {wo.material} {wo.process}</option>
                    ))}
                    <option value="none">None (Maintenance/Setup)</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="operator" className="block text-sm font-medium text-gray-700">Operator</label>
                <div className="mt-1">
                  <select id="operator" name="operator" value={formData.operator} onChange={handleChange} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                    <option>Ahmed Hassan</option>
                    <option>Mohamed Ali</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">
                  <select id="status" name="status" value={formData.status} onChange={handleChange} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                    <option>Under Process</option>
                    <option>Completed</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">Start Time</label>
                <div className="mt-1">
                  <input type="time" name="startTime" id="startTime" value={formData.startTime} onChange={handleChange} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">End Time</label>
                <div className="mt-1">
                  <input type="time" name="endTime" id="endTime" value={formData.endTime} onChange={handleChange} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700">Duration (hrs)</label>
                <div className="mt-1">
                  <input type="number" step="0.1" name="duration" id="duration" value={formData.duration} onChange={handleChange} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="qtyProduced" className="block text-sm font-medium text-gray-700">Quantity Produced</label>
                <div className="mt-1">
                  <input type="number" name="qtyProduced" id="qtyProduced" value={formData.qtyProduced} onChange={handleChange} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="qtyScrap" className="block text-sm font-medium text-gray-700">Quantity Scrap</label>
                <div className="mt-1">
                  <input type="number" name="qtyScrap" id="qtyScrap" value={formData.qtyScrap} onChange={handleChange} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="remarks" className="block text-sm font-medium text-gray-700">Remarks</label>
                <div className="mt-1">
                  <textarea id="remarks" name="remarks" rows={3} value={formData.remarks} onChange={handleChange} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-5">
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setFormData({...formData, startTime: '', endTime: '', duration: '', qtyProduced: '', qtyScrap: '', remarks: ''})} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Cancel
            </button>
            <button type="button" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <Play className="h-4 w-4 mr-2" /> Start Timer
            </button>
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
              <Save className="h-4 w-4 mr-2" /> Save Record
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function WorkshopHistory() {
  const [records, setRecords] = useState<any[]>([]);
  const { user, isAuthReady } = useFirebase();

  useEffect(() => {
    if (!isAuthReady || !user) return;

    const q = query(collection(db, 'workshop_records'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRecords: any[] = [];
      snapshot.forEach((doc) => {
        fetchedRecords.push({ id: doc.id, ...doc.data() });
      });
      setRecords(fetchedRecords);
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  return (
    <div className="space-y-6">
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {records.map((record) => (
            <li key={record.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-indigo-600 truncate">
                    {record.workorder !== 'none' ? `WO: ${record.workorder}` : 'Maintenance/Setup'}
                  </p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {record.status}
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      <Factory className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      {record.workshop} - {record.machine}
                    </p>
                    <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                      Operator: {record.operator}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <p>
                      Produced: {record.qtyProduced || 0} | Scrap: {record.qtyScrap || 0}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          ))}
          {records.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-gray-500">
              No workshop records found.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

export default function WorkshopExecution() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Workshop Execution</h1>
        <p className="mt-1 text-sm text-gray-500">Record daily production activities and machine usage.</p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => (
              <NavLink
                key={tab.name}
                to={`/workshop/${tab.path}`}
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
            <Route path="/" element={<Navigate to="record" replace />} />
            <Route path="record" element={<WorkshopRecord />} />
            <Route path="history" element={<WorkshopHistory />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
