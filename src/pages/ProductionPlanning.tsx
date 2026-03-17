import React from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { CalendarDays, Play, ArrowRight, ArrowLeft, RotateCcw, Bell, Check, X, Clock } from 'lucide-react';
import { useWorkOrders } from '../context/WorkOrderContext';
import { useMasterData } from '../context/MasterDataContext';
import { collection, onSnapshot, query, where, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useFirebase } from '../context/FirebaseContext';
import { useState, useEffect, useMemo } from 'react';

const tabs = [
  { name: 'Work Order Execution', path: 'execution' },
  { name: 'Open order - Workshop', path: 'workshop' },
  { name: 'Weekly Production Plan', path: 'weekly' },
  { name: 'Capacity Calculation', path: 'capacity' },
  { name: 'Gantt Chart', path: 'gantt' },
  { name: 'Planning Notification', path: 'notification' },
];

function OpenOrdersWorkshop() {
  const { orders } = useWorkOrders();
  const { workshops: masterWorkshops, routing: masterRouting } = useMasterData();
  const [workshopFilter, setWorkshopFilter] = useState(localStorage.getItem('activeWorkshop') || 'All');
  const [stageFilter, setStageFilter] = useState('All');
  const [woFilter, setWoFilter] = useState('');
  
  const openOrders = orders.filter(o => o.status !== 'Completed' && o.status !== 'Canceled');
  
  // Use workshops from master data
  const workshopOptions = useMemo(() => {
    return Array.from(new Set(masterWorkshops.map(w => w.name?.trim()).filter(Boolean))).sort();
  }, [masterWorkshops]);

  // Get stages related to the selected workshop from routing master and workshop master
  const stageOptions = useMemo(() => {
    const stagesFromRouting = masterRouting
      .filter(r => workshopFilter === 'All' || r.workshopId?.trim() === workshopFilter.trim())
      .map(r => r.stageName?.trim())
      .filter(Boolean);
    
    const stagesFromWorkshops = masterWorkshops
      .filter(w => workshopFilter === 'All' || w.name?.trim() === workshopFilter.trim())
      .map(w => w.stageName?.trim())
      .filter(Boolean);

    return Array.from(new Set([...stagesFromRouting, ...stagesFromWorkshops])).sort();
  }, [workshopFilter, masterRouting, masterWorkshops]);

  // Reset stage filter if it's no longer valid for the selected workshop
  useEffect(() => {
    if (stageFilter !== 'All' && !stageOptions.includes(stageFilter)) {
      setStageFilter('All');
    }
  }, [stageOptions, stageFilter]);

  // Filter by workshop, stage and WO No
  const filteredOrders = openOrders.filter(o => {
    const matchWorkshop = workshopFilter === 'All' || o.workshop === workshopFilter;
    const matchStage = stageFilter === 'All' || o.stage === stageFilter;
    const matchWO = woFilter === '' || (o.id?.toLowerCase() || '').includes(woFilter.toLowerCase());
    return matchWorkshop && matchStage && matchWO;
  });

  // Group orders by stage
  const stageGroups = filteredOrders.reduce((acc: Record<string, any[]>, order) => {
    const stage = (order.stage || 'Unassigned').trim();
    if (!acc[stage]) acc[stage] = [];
    acc[stage].push(order);
    return acc;
  }, {});

  // The stages to display should be the ones from the master data if a workshop is selected,
  // or just the ones present in the filtered orders if "All" is selected.
  const stagesToDisplay = useMemo(() => {
    if (workshopFilter === 'All' && stageFilter === 'All') {
      return Object.keys(stageGroups).sort();
    }
    if (stageFilter !== 'All') {
      return [stageFilter];
    }
    return stageOptions;
  }, [workshopFilter, stageFilter, stageOptions, stageGroups]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="w-full">
          <label htmlFor="workshop-filter" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Filter by Workshop</label>
          <select
            id="workshop-filter"
            value={workshopFilter}
            onChange={(e) => {
              const val = e.target.value;
              setWorkshopFilter(val);
              if (val !== 'All') localStorage.setItem('activeWorkshop', val);
              setStageFilter('All');
            }}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white border"
          >
            <option value="All">All Workshops</option>
            {workshopOptions.map(ws => (
              <option key={ws} value={ws}>{ws}</option>
            ))}
          </select>
        </div>
        <div className="w-full">
          <label htmlFor="stage-filter-workshop" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Filter by Stage</label>
          <select
            id="stage-filter-workshop"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white border"
          >
            <option value="All">All Stages</option>
            {stageOptions.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="w-full">
          <label htmlFor="wo-filter-workshop" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Filter by WO No</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Play className="h-4 w-4 text-gray-400" />
            </div>
            <input
              id="wo-filter-workshop"
              type="text"
              value={woFilter}
              onChange={(e) => setWoFilter(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search WO No..."
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/4 border-r border-gray-200">
                      Production Stage
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Open Work Orders
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stagesToDisplay.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-6 py-12 text-center text-sm text-gray-500 italic">
                        No open work orders found for the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    stagesToDisplay.map((stage) => (
                      <tr key={stage}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600 bg-gray-50 border-r border-gray-200 align-top">
                          {stage}
                          <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter">
                            {(stageGroups[stage] || []).length} Active Orders
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 p-0">
                          <div className="divide-y divide-gray-100">
                            {(stageGroups[stage] || []).length === 0 ? (
                              <div className="p-4 text-xs text-gray-400 italic">No orders in this stage</div>
                            ) : (
                              stageGroups[stage].map((order) => (
                                <div key={order.id} className="p-4 hover:bg-indigo-50 transition-colors flex justify-between items-center">
                                  <div>
                                    <div className="font-bold text-gray-900">{order.id}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                      {order.material} | {order.dimensions} | Qty: {order.qty}
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded uppercase">
                                        {order.workshop || 'No Workshop'}
                                      </span>
                                      <span className={cn(
                                        "px-2 py-0.5 text-[10px] font-bold rounded uppercase",
                                        order.priority === 'Urgent' ? "bg-red-100 text-red-700" :
                                        order.priority === 'High' ? "bg-orange-100 text-orange-700" :
                                        "bg-gray-100 text-gray-700"
                                      )}>
                                        {order.priority}
                                      </span>
                                      <span className={cn(
                                        "px-2 py-0.5 text-[10px] font-bold rounded uppercase",
                                        order.status === 'Completed' ? "bg-green-100 text-green-700" :
                                        order.status === 'In Production' ? "bg-blue-100 text-blue-700 animate-pulse" :
                                        order.status === 'Planned' ? "bg-indigo-100 text-indigo-700" :
                                        "bg-gray-100 text-gray-700"
                                      )}>
                                        {order.status === 'In Production' ? (order.workshop || 'In Production') : (order.status || 'Planned')}
                                      </span>
                                      {order.status === 'In Production' && (
                                        <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-ping" title="Worker Active" />
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase">Due Date</div>
                                    <div className="text-xs font-mono font-bold text-gray-700">{order.due}</div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkOrderExecution() {
  const { orders, updateOrder } = useWorkOrders();
  const { routing, workshops } = useMasterData();
  const [workshopFilter, setWorkshopFilter] = useState(localStorage.getItem('activeWorkshop') || 'All');
  const [stageFilter, setStageFilter] = useState('');
  const [woFilter, setWoFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('Not Complete');

  const uniqueStages = Array.from(new Set(routing.map(r => r.stageName?.trim()).filter(Boolean))).sort();
  const workshopOptions = useMemo(() => {
    return Array.from(new Set(workshops.map(w => w.name?.trim()).filter(Boolean))).sort();
  }, [workshops]);

  const filteredOrders = orders.filter(wo => {
    const matchWorkshop = workshopFilter === 'All' || wo.workshop === workshopFilter || 
      wo.stages?.find((s: any) => s.status === 'current')?.workshop === workshopFilter;
    const matchStage = stageFilter === '' || (wo.stage?.toLowerCase() || '').includes(stageFilter.toLowerCase());
    const matchWO = woFilter === '' || (wo.id?.toLowerCase() || '').includes(woFilter.toLowerCase());
    
    let matchStatus = true;
    if (statusFilter === 'Complete') {
      matchStatus = wo.status === 'Completed';
    } else if (statusFilter === 'Not Complete') {
      matchStatus = wo.status !== 'Completed';
    }
    
    return matchWorkshop && matchStage && matchWO && matchStatus;
  });

  const handleStartStage = async (wo: any) => {
    if (wo.status === 'Planned') {
      const currentStage = wo.stages.find((s: any) => s.status === 'current');
      await updateOrder(wo.id, { 
        status: 'In Production',
        workshop: currentStage?.workshop || wo.workshop
      });
    }
  };

  const handleNextStage = async (wo: any) => {
    const currentIndex = wo.stages.findIndex((s: any) => s.status === 'current');
    if (currentIndex >= 0) {
      const currentStageName = wo.stages[currentIndex].name.toLowerCase();
      const isQualityStage = currentStageName.includes('quality') || currentStageName.includes('inspection');

      if (isQualityStage) {
        alert('This stage requires Quality Control approval. It cannot be moved to the next stage from here. Please use the Quality Control menu.');
        return;
      }

      if (currentIndex < wo.stages.length - 1) {
        const newStages = [...wo.stages];
        newStages[currentIndex].status = 'completed';
        newStages[currentIndex + 1].status = 'current';
        
        const isLastStage = currentIndex + 1 === wo.stages.length - 1;
        
        await updateOrder(wo.id, { 
          stages: newStages,
          stage: newStages[currentIndex + 1].name,
          workshop: newStages[currentIndex + 1].workshop,
          status: isLastStage ? 'Completed' : 'In Production'
        });
      } else {
        const newStages = [...wo.stages];
        newStages[currentIndex].status = 'completed';
        await updateOrder(wo.id, {
          stages: newStages,
          status: 'Completed'
        });
      }
    }
  };

  const handlePrevStage = async (wo: any) => {
    const currentIndex = wo.stages.findIndex((s: any) => s.status === 'current');
    if (currentIndex > 0) {
      const newStages = [...wo.stages];
      newStages[currentIndex].status = 'pending';
      newStages[currentIndex - 1].status = 'current';
      // Increment reworkCount for the stage we're going back to
      newStages[currentIndex - 1].reworkCount = (newStages[currentIndex - 1].reworkCount || 0) + 1;
      
      await updateOrder(wo.id, { 
        stages: newStages,
        stage: newStages[currentIndex - 1].name,
        workshop: newStages[currentIndex - 1].workshop,
        status: 'In Production'
      });
    }
  };

  const handleRework = async (wo: any) => {
    const newStages = wo.stages.map((s: any, idx: number) => ({
      ...s,
      status: idx === 0 ? 'current' : 'pending',
      // Increment reworkCount for all stages that were already completed or current
      reworkCount: (s.status === 'completed' || s.status === 'current') 
        ? (s.reworkCount || 0) + 1 
        : (s.reworkCount || 0)
    }));
    await updateOrder(wo.id, { 
      stages: newStages,
      stage: newStages[0].name,
      workshop: newStages[0].workshop,
      status: 'In Production'
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="w-full">
          <label htmlFor="workshop-filter-exec" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Filter by Workshop</label>
          <select
            id="workshop-filter-exec"
            value={workshopFilter}
            onChange={(e) => {
              const val = e.target.value;
              setWorkshopFilter(val);
              if (val !== 'All') localStorage.setItem('activeWorkshop', val);
            }}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white border"
          >
            <option value="All">All Workshops</option>
            {workshopOptions.map(ws => (
              <option key={ws} value={ws}>{ws}</option>
            ))}
          </select>
        </div>
        <div className="w-full">
          <label htmlFor="wo-filter" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Filter by WO No</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Play className="h-4 w-4 text-gray-400" />
            </div>
            <input
              id="wo-filter"
              type="text"
              value={woFilter}
              onChange={(e) => setWoFilter(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search WO No..."
            />
          </div>
        </div>
        <div className="w-full">
          <label htmlFor="stage-filter" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Filter by Stage</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Clock className="h-4 w-4 text-gray-400" />
            </div>
            <input
              id="stage-filter"
              list="routing-stages"
              type="text"
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search stage (from Routing Master)..."
            />
            <datalist id="routing-stages">
              {uniqueStages.map(stage => (
                <option key={stage} value={stage} />
              ))}
            </datalist>
          </div>
        </div>
        <div className="w-full">
          <label htmlFor="status-filter" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Filter by Status</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white"
          >
            <option value="All">All Work Orders</option>
            <option value="Not Complete">Not Complete</option>
            <option value="Complete">Complete</option>
          </select>
        </div>
        <div className="sm:col-span-4 text-right text-sm text-gray-500">
          Showing {filteredOrders.length} of {orders.length} orders
        </div>
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg shadow-sm">
          <Clock className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No matching orders</h3>
          <p className="mt-1 text-sm text-gray-500">
            No work orders found matching your criteria.
          </p>
        </div>
      )}

      {filteredOrders.map((wo) => (
        <div key={wo.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">{wo.id}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-gray-500">{wo.material} - {wo.process}</p>
                  <span className={cn(
                    "px-2 py-0.5 text-[10px] font-bold rounded uppercase",
                    wo.status === 'Completed' ? "bg-green-100 text-green-700" :
                    wo.status === 'In Production' ? "bg-blue-100 text-blue-700 animate-pulse" :
                    wo.status === 'Planned' ? "bg-indigo-100 text-indigo-700" :
                    "bg-gray-100 text-gray-700"
                  )}>
                    {wo.status === 'In Production' ? (wo.workshop || 'In Production') : (wo.status || 'Planned')}
                  </span>
                  {wo.status === 'In Production' && (
                    <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-ping" title="Worker Active" />
                  )}
                </div>
              </div>
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
                <React.Fragment key={`${stage.name}-${index}`}>
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <div className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-full border-2",
                        stage.status === 'completed' ? "bg-green-100 border-green-500 text-green-600" :
                        stage.status === 'current' ? "bg-indigo-100 border-indigo-500 text-indigo-600 font-bold" :
                        "bg-gray-50 border-gray-300 text-gray-400"
                      )}>
                        {index + 1}
                      </div>
                      {(stage.reworkCount || 0) > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-white shadow-sm" title={`Rework count: ${stage.reworkCount}`}>
                          {stage.reworkCount}
                        </div>
                      )}
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
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [processedRequests, setProcessedRequests] = useState<any[]>([]);
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

    // Listen for Pending requests
    const qPending = query(
      collection(db, 'overtime_requests'),
      where('status', '==', 'Pending')
    );
    const unsubPending = onSnapshot(qPending, (snapshot) => {
      const records: any[] = [];
      snapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() });
      });
      // Sort in memory
      const sorted = records.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setPendingRequests(sorted);
    }, (error) => {
      console.error('Error fetching pending overtime requests:', error);
    });

    // Listen for recently Processed requests (last 5)
    const qProcessed = query(
      collection(db, 'overtime_requests'),
      where('status', 'in', ['Approved', 'Rejected'])
    );
    const unsubProcessed = onSnapshot(qProcessed, (snapshot) => {
      const records: any[] = [];
      snapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() });
      });
      // Sort in memory and limit to last 5 for the "Recent" view
      const sorted = records.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setProcessedRequests(sorted.slice(0, 5));
    }, (error) => {
      console.error('Error fetching processed overtime requests:', error);
    });

    return () => {
      unsubPending();
      unsubProcessed();
    };
  }, [user, isAuthReady]);

  const handleStatusChange = async (id: string, newStatus: 'Approved' | 'Rejected') => {
    try {
      const docRef = doc(db, 'overtime_requests', id);
      await updateDoc(docRef, { 
        status: newStatus,
        processedBy: user?.email,
        processedAt: new Date().toISOString()
      });
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
          {pendingRequests.length} Pending
        </span>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {pendingRequests.map((req) => (
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
          {pendingRequests.length === 0 && (
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
            <Route path="workshop" element={<OpenOrdersWorkshop />} />
            <Route path="weekly" element={<PlaceholderTab title="Weekly Production Plan" />} />
            <Route path="capacity" element={<PlaceholderTab title="Capacity Calculation" />} />
            <Route path="gantt" element={<PlaceholderTab title="Gantt Chart" />} />
            <Route path="notification" element={<PlanningNotification />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
