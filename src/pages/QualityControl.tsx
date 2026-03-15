import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { CheckSquare, Check, X, AlertCircle, RotateCcw, Clock } from 'lucide-react';
import { useWorkOrders } from '../context/WorkOrderContext';
import { useFirebase } from '../context/FirebaseContext';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const tabs = [
  { name: 'Pending Inspection', path: 'pending' },
  { name: 'Inspection History', path: 'history' },
];

function PendingInspection() {
  const { orders, updateOrder } = useWorkOrders();
  const { user } = useFirebase();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const pendingOrders = orders.filter(o => 
    o.status !== 'Completed' && 
    (o.stage?.toLowerCase() || '').includes('inspection') || (o.stage?.toLowerCase() || '').includes('quality')
  );

  const handleInspect = async (order: any, result: 'Pass' | 'Reject' | 'RejectLast') => {
    if (!user) return;
    setProcessingId(order.id);
    setFeedback(null);

    try {
      console.log(`Starting inspection for WO: ${order.id}, Result: ${result}`);
      
      // Save inspection record
      await addDoc(collection(db, 'quality_inspections'), {
        workOrderId: order.id,
        material: order.material || 'Unknown',
        qty: order.qty || 0,
        result,
        inspector: user.email || 'Unknown',
        authorId: user.uid,
        createdAt: new Date().toISOString()
      });

      // Update work order
      const newStages = [...(order.stages || [])];
      const currentIndex = newStages.findIndex((s: any) => s.status === 'current');
      
      if (result === 'Pass') {
        if (currentIndex !== -1) {
          newStages[currentIndex].status = 'completed';
          if (currentIndex + 1 < newStages.length) {
            newStages[currentIndex + 1].status = 'current';
            await updateOrder(order.id, {
              qualityStatus: 'Approved',
              stages: newStages,
              stage: newStages[currentIndex + 1].name
            });
          } else {
            // All stages completed
            await updateOrder(order.id, {
              qualityStatus: 'Approved',
              stages: newStages,
              status: 'Completed',
              completionDate: new Date().toISOString().split('T')[0]
            });
          }
        } else {
          throw new Error('No current stage found for this work order.');
        }
      } else if (result === 'Reject') {
        // FULL REJECT: Reset all stages to beginning
        const resetStages = (order.stages || []).map((s: any, idx: number) => ({
          ...s,
          status: idx === 0 ? 'current' : 'pending'
        }));

        await updateOrder(order.id, {
          qualityStatus: 'Rejected (Full)',
          stages: resetStages,
          stage: resetStages[0]?.name || 'Unknown',
          status: 'In Production'
        });
      } else if (result === 'RejectLast') {
        // LAST PROCESS REJECT: Return to the previous stage
        if (currentIndex > 0) {
          const resetStages = (order.stages || []).map((s: any, idx: number) => {
            if (idx === currentIndex - 1) return { ...s, status: 'current' };
            if (idx === currentIndex) return { ...s, status: 'pending' };
            return s;
          });

          await updateOrder(order.id, {
            qualityStatus: 'Rejected (Last Process)',
            stages: resetStages,
            stage: resetStages[currentIndex - 1].name,
            status: 'In Production'
          });
        } else {
          // If it's the first stage, it's the same as full reject
          const resetStages = (order.stages || []).map((s: any, idx: number) => ({
            ...s,
            status: idx === 0 ? 'current' : 'pending'
          }));
          await updateOrder(order.id, {
            qualityStatus: 'Rejected (Full)',
            stages: resetStages,
            stage: resetStages[0]?.name || 'Unknown',
            status: 'In Production'
          });
        }
      }
      
      const message = result === 'Pass' 
        ? 'Inspection recorded as Pass.' 
        : result === 'Reject' 
          ? 'Work Order has been reset to the first stage.' 
          : 'Work Order has been returned to the previous stage.';
      
      setFeedback({ message, type: 'success' });
    } catch (error) {
      console.error('Error saving inspection:', error);
      setFeedback({ 
        message: error instanceof Error ? error.message : 'Failed to save inspection.', 
        type: 'error' 
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div className={cn(
          "p-4 rounded-md flex items-center gap-3",
          feedback.type === 'success' ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
        )}>
          {feedback.type === 'success' ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <p className="text-sm font-medium">{feedback.message}</p>
          <button onClick={() => setFeedback(null)} className="ml-auto text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {pendingOrders.map((item) => (
          <div key={item.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{item.id}</h3>
                  <p className="text-sm text-gray-500">{item.stage}</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Pending
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-gray-500">Quantity</span>
                  <span className="font-medium text-gray-900">{item.qty} pcs</span>
                </div>
                <div>
                  <span className="block text-gray-500">Date</span>
                  <span className="font-medium text-gray-900">{item.start}</span>
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-2">
                <button 
                  disabled={processingId !== null}
                  onClick={() => handleInspect(item, 'Pass')} 
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {processingId === item.id ? <Clock className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  Pass Stage
                </button>
                <div className="flex gap-2">
                  <button 
                    disabled={processingId !== null}
                    onClick={() => handleInspect(item, 'RejectLast')} 
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    {processingId === item.id ? <Clock className="h-3 w-3 animate-spin mr-1" /> : <RotateCcw className="h-3 w-3 mr-1" />}
                    Reject to Last
                  </button>
                  <button 
                    disabled={processingId !== null}
                    onClick={() => handleInspect(item, 'Reject')} 
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                  >
                    {processingId === item.id ? <Clock className="h-3 w-3 animate-spin mr-1" /> : <X className="h-3 w-3 mr-1" />}
                    Reject to Start
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {pendingOrders.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            No work orders pending inspection.
          </div>
        )}
      </div>
    </div>
  );
}

function InspectionHistory() {
  const [records, setRecords] = useState<any[]>([]);
  const { user, isAuthReady } = useFirebase();

  useEffect(() => {
    if (!isAuthReady || !user) return;

    const q = query(collection(db, 'quality_inspections'), orderBy('createdAt', 'desc'));
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
                    WO: {record.workOrderId}
                  </p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className={cn(
                      "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                      record.result === 'Pass' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    )}>
                      {record.result}
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      Material: {record.material}
                    </p>
                    <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                      Inspector: {record.inspector}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <p>
                      Qty: {record.qty}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          ))}
          {records.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-gray-500">
              No inspection records found.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

export default function QualityControl() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quality Control</h1>
        <p className="mt-1 text-sm text-gray-500">Manage inspections, approvals, and rejections.</p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => (
              <NavLink
                key={tab.name}
                to={`/quality/${tab.path}`}
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
            <Route path="/" element={<Navigate to="pending" replace />} />
            <Route path="pending" element={<PendingInspection />} />
            <Route path="history" element={<InspectionHistory />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
