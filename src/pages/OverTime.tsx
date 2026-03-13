import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Clock, Plus, Search, X, Printer, Edit } from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { useMasterData } from '../context/MasterDataContext';
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase';

const tabs = [
  { name: 'Requested Overtime', path: 'requested' },
  { name: 'Overtime History', path: 'history' },
];

function calculateHours(timeFrom: string, timeTo: string): number {
  if (!timeFrom || !timeTo) return 0;
  const [fromH, fromM] = timeFrom.split(':').map(Number);
  const [toH, toM] = timeTo.split(':').map(Number);
  let diff = (toH + toM / 60) - (fromH + fromM / 60);
  if (diff < 0) diff += 24; // Handle overnight shifts
  return Number(diff.toFixed(2));
}

function RequestedOvertime() {
  const [requests, setRequests] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { user, isAuthReady } = useFirebase();
  const { operators } = useMasterData();
  const [userRole, setUserRole] = useState<string>('User');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    operatorId: '',
    operator: '',
    workshop: '',
    timeFrom: '',
    timeTo: '',
    hours: 0,
    reason: ''
  });

  useEffect(() => {
    if (!user?.email) return;
    const q = query(collection(db, 'users'), where('email', '==', user.email));
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setUserRole(snapshot.docs[0].data().role);
      }
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!isAuthReady || !user) return;

    const q = query(collection(db, 'overtime_requests'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records: any[] = [];
      snapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() });
      });
      setRequests(records);
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingId) {
        const docRef = doc(db, 'overtime_requests', editingId);
        await updateDoc(docRef, {
          ...formData,
          hours: calculateHours(formData.timeFrom, formData.timeTo)
        });
      } else {
        await addDoc(collection(db, 'overtime_requests'), {
          ...formData,
          hours: calculateHours(formData.timeFrom, formData.timeTo),
          status: 'Pending',
          authorId: user.uid,
          createdAt: new Date().toISOString()
        });
      }
      setShowAddModal(false);
      setEditingId(null);
      setFormData({ date: new Date().toISOString().split('T')[0], operatorId: '', operator: '', workshop: '', timeFrom: '', timeTo: '', hours: 0, reason: '' });
    } catch (error) {
      console.error('Error saving overtime request:', error);
      alert('Failed to save overtime request.');
    }
  };

  const handleEdit = (req: any) => {
    setFormData({
      date: req.date,
      operatorId: req.operatorId || '',
      operator: req.operator || '',
      workshop: req.workshop || '',
      timeFrom: req.timeFrom || '',
      timeTo: req.timeTo || '',
      hours: req.hours || 0,
      reason: req.reason || ''
    });
    setEditingId(req.id);
    setShowAddModal(true);
  };

  const handleStatusChange = async (id: string, newStatus: 'Approved' | 'Rejected') => {
    try {
      const docRef = doc(db, 'overtime_requests', id);
      await updateDoc(docRef, { status: newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status.');
    }
  };

  const handleOperatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOpId = e.target.value;
    const selectedOp = operators.find(op => op.id === selectedOpId);
    if (selectedOp) {
      setFormData({
        ...formData,
        operatorId: selectedOp.id,
        operator: selectedOp.name,
        workshop: selectedOp.workshop
      });
    } else {
      setFormData({
        ...formData,
        operatorId: '',
        operator: '',
        workshop: ''
      });
    }
  };

  // Only show Pending requests here
  const filteredRequests = requests.filter(req => 
    req.status === 'Pending' &&
    ((req.operator || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (req.operatorId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (req.workshop || '').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const canApprove = userRole === 'Admin' || userRole === 'Manager';

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center print:hidden">
        <div className="relative w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Search requests..."
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => window.print()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </button>
          <button 
            onClick={() => {
              setEditingId(null);
              setFormData({ date: new Date().toISOString().split('T')[0], operatorId: '', operator: '', workshop: '', timeFrom: '', timeTo: '', hours: 0, reason: '' });
              setShowAddModal(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </button>
        </div>
      </div>

      <div className="flex flex-col print:mt-0">
        <div className="hidden print:block mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Pending Overtime Requests</h2>
          <p className="text-gray-500">
            {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg print:shadow-none print:border-none">
              <table className="min-w-full divide-y divide-gray-200 print:border print:border-gray-300">
                <thead className="bg-gray-50 print:bg-gray-100">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:border print:border-gray-300">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:border print:border-gray-300">Operator ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:border print:border-gray-300">Operator</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:border print:border-gray-300">Workshop</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:border print:border-gray-300">Time</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:border print:border-gray-300">Hours</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:border print:border-gray-300">Status</th>
                    <th scope="col" className="relative px-6 py-3 print:hidden"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map((req) => (
                    <tr key={req.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 print:border print:border-gray-300">{req.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 print:border print:border-gray-300">{req.operatorId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 print:border print:border-gray-300">{req.operator}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 print:border print:border-gray-300">{req.workshop}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 print:border print:border-gray-300">{req.timeFrom} - {req.timeTo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 print:border print:border-gray-300">{req.hours}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 print:border print:border-gray-300">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 print:bg-transparent print:border print:border-gray-500">
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium print:hidden">
                        <div className="flex justify-end gap-3">
                          <button onClick={() => handleEdit(req)} className="text-indigo-600 hover:text-indigo-900">
                            <Edit className="h-4 w-4" />
                          </button>
                          {canApprove && (
                            <>
                              <button onClick={() => handleStatusChange(req.id, 'Approved')} className="text-green-600 hover:text-green-900">Approve</button>
                              <button onClick={() => handleStatusChange(req.id, 'Rejected')} className="text-red-600 hover:text-red-900">Reject</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRequests.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500 print:border print:border-gray-300">
                        No pending overtime requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Print Footer */}
        <div className="hidden print:flex justify-between mt-16 pt-8 border-t border-gray-300">
          <div className="text-center w-64">
            <div className="border-b border-gray-400 mb-2 h-8"></div>
            <p className="text-sm font-medium text-gray-900">Signed by</p>
          </div>
          <div className="text-center w-64">
            <div className="border-b border-gray-400 mb-2 h-8"></div>
            <p className="text-sm font-medium text-gray-900">Approved by</p>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">{editingId ? 'Edit Overtime Request' : 'New Overtime Request'}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Operator</label>
                <select
                  required
                  value={formData.operatorId}
                  onChange={handleOperatorChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select Operator</option>
                  {operators.map(op => (
                    <option key={op.id} value={op.id}>{op.id} - {op.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Workshop</label>
                <input
                  type="text"
                  required
                  readOnly
                  value={formData.workshop}
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Time From</label>
                  <input
                    type="time"
                    required
                    value={formData.timeFrom}
                    onChange={e => setFormData({...formData, timeFrom: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Time To</label>
                  <input
                    type="time"
                    required
                    value={formData.timeTo}
                    onChange={e => setFormData({...formData, timeTo: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Hours</label>
                <input
                  type="text"
                  readOnly
                  value={calculateHours(formData.timeFrom, formData.timeTo)}
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Reason</label>
                <textarea
                  required
                  value={formData.reason}
                  onChange={e => setFormData({...formData, reason: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  rows={3}
                />
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
                  {editingId ? 'Save Changes' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function OvertimeHistory() {
  const [requests, setRequests] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { user, isAuthReady } = useFirebase();

  useEffect(() => {
    if (!isAuthReady || !user) return;

    const q = query(collection(db, 'overtime_requests'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records: any[] = [];
      snapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() });
      });
      setRequests(records);
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  const filteredRequests = requests.filter(req => {
    const matchesSearch = (req.operator || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (req.operatorId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (req.workshop || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDateFrom = dateFrom ? req.date >= dateFrom : true;
    const matchesDateTo = dateTo ? req.date <= dateTo : true;
    // History shows Approved and Rejected
    return matchesSearch && matchesDateFrom && matchesDateTo && req.status !== 'Pending';
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-4 print:hidden">
        <div className="flex flex-wrap gap-4">
          <div className="relative w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search worker or workshop..."
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="block w-40 py-2 px-3 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="block w-40 py-2 px-3 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>
        <button 
          onClick={handlePrint}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Printer className="h-4 w-4 mr-2" />
          Print Report
        </button>
      </div>

      <div className="flex flex-col print:mt-0">
        <div className="hidden print:block mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Overtime History Report</h2>
          <p className="text-gray-500">
            {dateFrom && dateTo ? `Period: ${dateFrom} to ${dateTo}` : 'All Time'}
          </p>
        </div>

        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg print:shadow-none print:border-none">
              <table className="min-w-full divide-y divide-gray-200 print:border print:border-gray-300">
                <thead className="bg-gray-50 print:bg-gray-100">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:border print:border-gray-300">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:border print:border-gray-300">Operator ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:border print:border-gray-300">Operator</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:border print:border-gray-300">Workshop</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:border print:border-gray-300">Time</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:border print:border-gray-300">Hours</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:border print:border-gray-300">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map((req) => (
                    <tr key={req.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 print:border print:border-gray-300">{req.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 print:border print:border-gray-300">{req.operatorId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 print:border print:border-gray-300">{req.operator}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 print:border print:border-gray-300">{req.workshop}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 print:border print:border-gray-300">{req.timeFrom} - {req.timeTo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 print:border print:border-gray-300">{req.hours}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 print:border print:border-gray-300">
                        <span className={cn(
                          "px-2 inline-flex text-xs leading-5 font-semibold rounded-full print:border print:border-gray-500 print:bg-transparent",
                          req.status === 'Approved' ? "bg-green-100 text-green-800" : 
                          req.status === 'Rejected' ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                        )}>
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredRequests.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500 print:border print:border-gray-300">
                        No overtime history found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Print Footer */}
        <div className="hidden print:flex justify-between mt-16 pt-8 border-t border-gray-300">
          <div className="text-center w-64">
            <div className="border-b border-gray-400 mb-2 h-8"></div>
            <p className="text-sm font-medium text-gray-900">Signed by</p>
          </div>
          <div className="text-center w-64">
            <div className="border-b border-gray-400 mb-2 h-8"></div>
            <p className="text-sm font-medium text-gray-900">Approved by</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OverTime() {
  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <h1 className="text-2xl font-bold text-gray-900">Overtime Management</h1>
        <p className="mt-1 text-sm text-gray-500">Manage and approve operator overtime requests.</p>
      </div>

      <div className="bg-white shadow rounded-lg print:shadow-none print:bg-transparent">
        <div className="border-b border-gray-200 print:hidden">
          <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => (
              <NavLink
                key={tab.name}
                to={`/overtime/${tab.path}`}
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

        <div className="p-6 print:p-0">
          <Routes>
            <Route path="/" element={<Navigate to="requested" replace />} />
            <Route path="requested" element={<RequestedOvertime />} />
            <Route path="history" element={<OvertimeHistory />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
