import React from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { CalendarDays, Play, ArrowRight, ArrowLeft, RotateCcw, Bell, Check, X } from 'lucide-react';
import { useWorkOrders } from '../context/WorkOrderContext';
import { collection, onSnapshot, query, where, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useFirebase } from '../context/FirebaseContext';
import { useState, useEffect } from 'react';

const tabs = [
  { name: 'Work Order Execution', path: 'execution' },
  { name: 'Weekly Production Plan', path: 'weekly' },
  { name: 'Capacity Calculation', path: 'capacity' },
  { name: 'Routing', path: 'routing' },
  { name: 'Gantt Chart', path: 'gantt' },
  { name: 'Planning Notification', path: 'notification' },
];

function WorkOrderExecution() {
  const { orders, updateOrder } = useWorkOrders();

  const handleStartStage = async (wo: any) => {
    if (wo.status === 'Planned') {
      await updateOrder(wo.id, { status: 'In Production' });
    }
  };

  const handleNextStage = async (wo: any) => {
    const currentIndex = wo.stages.findIndex((s: any) => s.status === 'current');
    if (currentIndex >= 0 && currentIndex < wo.stages.length - 1) {
      const newStages = [...wo.stages];
      newStages[currentIndex].status = 'completed';
      newStages[currentIndex + 1].status = 'current';
      
      const isLastStage = currentIndex + 1 === wo.stages.length - 1;
      
      await updateOrder(wo.id, { 
        stages: newStages,
        stage: newStages[currentIndex + 1].name,
        status: isLastStage ? 'Completed' : 'In Production'
      });
    } else if (currentIndex === wo.stages.length - 1) {
      const newStages = [...wo.stages];
      newStages[currentIndex].status = 'completed';
      await updateOrder(wo.id, {
        stages: newStages,
        status: 'Completed'
      });
    }
  };

  const handlePrevStage = async (wo: any) => {
    const currentIndex = wo.stages.findIndex((s: any) => s.status === 'current');
    if (currentIndex > 0) {
      const newStages = [...wo.stages];
      newStages[currentIndex].status = 'pending';
      newStages[currentIndex - 1].status = 'current';
      await updateOrder(wo.id, { 
        stages: newStages,
        stage: newStages[currentIndex - 1].name,
        status: 'In Production'
      });
    }
  };

  const handleRework = async (wo: any) => {
    const newStages = wo.stages.map((s: any, idx: number) => ({
      ...s,
      status: idx === 0 ? 'current' : 'pending'
    }));
    await updateOrder(wo.id, { 
      stages: newStages,
      stage: newStages[0].name,
      status: 'In Production'
    });
  };

  return (
    <div className="space-y-6">
      {orders.map((wo) => (
        <div key={wo.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">{wo.id}</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">{wo.material} - {wo.process}</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleStartStage(wo)}
                disabled={wo.status !== 'Planned'}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="h-3 w-3 mr-1" /> Start Stage
              </button>
              <button 
                onClick={() => handleNextStage(wo)}
                disabled={wo.status === 'Completed'}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRight className="h-3 w-3 mr-1" /> Next Stage
              </button>
              <button 
                onClick={() => handlePrevStage(wo)}
                disabled={wo.status === 'Completed' || wo.stages[0]?.status === 'current'}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="h-3 w-3 mr-1" /> Prev Stage
              </button>
              <button 
                onClick={() => handleRework(wo)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700"
              >
                <RotateCcw className="h-3 w-3 mr-1" /> Rework
              </button>
            </div>
          </div>
          <div className="px-4 py-5 sm:p-6 overflow-x-auto">
            <div className="flex items-center justify-between min-w-max">
              {wo.stages?.map((stage, index) => (
                <React.Fragment key={stage.name}>
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full border-2",
                      stage.status === 'completed' ? "bg-green-100 border-green-500 text-green-600" :
                      stage.status === 'current' ? "bg-indigo-100 border-indigo-500 text-indigo-600 font-bold" :
                      "bg-gray-50 border-gray-300 text-gray-400"
                    )}>
                      {index + 1}
                    </div>
                    <span className={cn(
                      "mt-2 text-xs text-center w-20",
                      stage.status === 'current' ? "font-bold text-indigo-600" : "text-gray-500"
                    )}>
                      {stage.name}
                    </span>
                  </div>
                  {index < wo.stages.length - 1 && (
                    <div className={cn(
                      "flex-1 h-0.5 mx-2 w-12",
                      stage.status === 'completed' ? "bg-green-500" : "bg-gray-200"
                    )} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PlanningNotification() {
  const [overtimeRequests, setOvertimeRequests] = useState<any[]>([]);
  const { user, isAuthReady } = useFirebase();
  const [userRole, setUserRole] = useState<string>('User');

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

    const q = query(
      collection(db, 'overtime_requests'),
      where('status', '==', 'Pending'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records: any[] = [];
      snapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() });
      });
      setOvertimeRequests(records);
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  const handleStatusChange = async (id: string, newStatus: 'Approved' | 'Rejected') => {
    try {
      const docRef = doc(db, 'overtime_requests', id);
      await updateDoc(docRef, { status: newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status.');
    }
  };

  const canApprove = userRole === 'Admin' || userRole === 'Manager';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900 flex items-center">
          <Bell className="h-5 w-5 mr-2 text-indigo-600" />
          Pending Overtime Notifications
        </h2>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
          {overtimeRequests.length} Pending
        </span>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {overtimeRequests.map((req) => (
            <li key={req.id}>
              <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-indigo-600 truncate">
                      {req.operator} ({req.operatorId})
                    </p>
                    <p className="text-sm text-gray-500">
                      Workshop: {req.workshop}
                    </p>
                  </div>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      {req.hours} Hours
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      <CalendarDays className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      {req.date} | {req.timeFrom} - {req.timeTo}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <p className="italic">Reason: {req.reason}</p>
                  </div>
                </div>
                {canApprove && (
                  <div className="mt-4 flex justify-end space-x-3">
                    <button
                      onClick={() => handleStatusChange(req.id, 'Rejected')}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <X className="h-4 w-4 mr-1 text-red-500" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleStatusChange(req.id, 'Approved')}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
          {overtimeRequests.length === 0 && (
            <li className="px-4 py-12 text-center text-gray-500 italic">
              No pending overtime requests at the moment.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function PlaceholderTab({ title }: { title: string }) {
  return (
    <div className="py-12 text-center">
      <CalendarDays className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">This module is under construction.</p>
    </div>
  );
}

export default function ProductionPlanning() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Production Planning</h1>
        <p className="mt-1 text-sm text-gray-500">Schedule, route, and manage workshop capacity.</p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => (
              <NavLink
                key={tab.name}
                to={`/planning/${tab.path}`}
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
            <Route path="/" element={<Navigate to="execution" replace />} />
            <Route path="execution" element={<WorkOrderExecution />} />
            <Route path="weekly" element={<PlaceholderTab title="Weekly Production Plan" />} />
            <Route path="capacity" element={<PlaceholderTab title="Capacity Calculation" />} />
            <Route path="routing" element={<PlaceholderTab title="Routing" />} />
            <Route path="gantt" element={<PlaceholderTab title="Gantt Chart" />} />
            <Route path="notification" element={<PlanningNotification />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
