import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Factory, Play, Square, Save } from 'lucide-react';
import { useWorkOrders } from '../context/WorkOrderContext';
import { useMasterData } from '../context/MasterDataContext';
import { useFirebase } from '../context/FirebaseContext';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const tabs = [
  { name: 'Workshop Record', path: 'record' },
  { name: 'Workshop History', path: 'history' },
];

function WorkshopRecord() {
  const { orders, updateOrder } = useWorkOrders();
  const { workshops, machines, operators, routing } = useMasterData();
  const { user } = useFirebase();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    priority: '1',
    workshop: '',
    machine: '',
    workorder: 'none',
    stage: '',
    operator: '',
    status: 'Under Process',
    startTime: '',
    endTime: '',
    duration: '',
    qtyProduced: '',
    qtyScrap: '',
    remarks: ''
  });

  const [timerActive, setTimerActive] = useState(false);
  const [timerStart, setTimerStart] = useState<number | null>(null);

  // Set initial values from master data
  useEffect(() => {
    if (workshops.length > 0 && !formData.workshop) {
      setFormData(prev => ({ ...prev, workshop: workshops[0].name }));
    }
    if (machines.length > 0 && !formData.machine) {
      setFormData(prev => ({ ...prev, machine: machines[0].name }));
    }
    if (operators.length > 0 && !formData.operator) {
      setFormData(prev => ({ ...prev, operator: operators[0].name }));
    }
  }, [workshops, machines, operators]);

  const selectedWO = useMemo(() => {
    return orders.find(o => o.id === formData.workorder);
  }, [orders, formData.workorder]);

  // Find routing info for the selected WO and stage
  const currentRoutingInfo = useMemo(() => {
    if (!selectedWO || !formData.stage) return null;
    return routing.find(r => 
      (r.routeId === selectedWO.routeId || r.processType === selectedWO.process) && 
      r.stageName === formData.stage
    );
  }, [selectedWO, formData.stage, routing]);

  // Set initial stage when workorder changes
  useEffect(() => {
    if (selectedWO && selectedWO.stages && selectedWO.stages.length > 0) {
      const currentStage = selectedWO.stages.find((s: any) => s.status === 'current');
      setFormData(prev => ({ ...prev, stage: currentStage ? currentStage.name : selectedWO.stages[0].name }));
    } else {
      setFormData(prev => ({ ...prev, stage: '' }));
    }
  }, [selectedWO]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // If workshop changes, check if current workorder is still valid
      if (name === 'workshop' && prev.workorder !== 'none') {
        const order = orders.find(o => o.id === prev.workorder);
        const currentStage = order?.stages?.find((s: any) => s.status === 'current');
        if (currentStage?.workshop !== value) {
          newData.workorder = 'none';
        }
      }
      
      return newData;
    });
  };

  const handleStartTimer = () => {
    setTimerActive(true);
    setTimerStart(Date.now());
    const now = new Date();
    setFormData(prev => ({
      ...prev,
      startTime: now.toTimeString().slice(0, 5)
    }));
  };

  const handleStopTimer = () => {
    if (!timerStart) return;
    setTimerActive(false);
    const now = new Date();
    const diffMs = Date.now() - timerStart;
    const diffHrs = (diffMs / (1000 * 60 * 60)).toFixed(2);
    
    setFormData(prev => ({
      ...prev,
      endTime: now.toTimeString().slice(0, 5),
      duration: diffHrs
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      // Save the workshop record
      await addDoc(collection(db, 'workshop_records'), {
        ...formData,
        authorId: user.uid,
        createdAt: new Date().toISOString()
      });

      // If status is "Completed", update the Work Order stages
      if (formData.status === 'Completed' && selectedWO) {
        // Check if this is a Quality or Inspection stage
        const isQualityStage = formData.stage.toLowerCase().includes('quality') || 
                              formData.stage.toLowerCase().includes('inspection');
        
        if (isQualityStage) {
          alert('This stage requires Quality Control approval. Please use the Quality Control menu to pass or reject this stage.');
          // We still save the workshop record, but we don't update the WO stages
        } else {
          const currentStages = [...selectedWO.stages];
          const currentIndex = currentStages.findIndex(s => s.name === formData.stage);
          
          if (currentIndex !== -1) {
            currentStages[currentIndex].status = 'completed';
            if (currentIndex + 1 < currentStages.length) {
              currentStages[currentIndex + 1].status = 'current';
              await updateOrder(selectedWO.id, {
                stages: currentStages,
                stage: currentStages[currentIndex + 1].name
              });
            } else {
              // All stages completed
              await updateOrder(selectedWO.id, {
                stages: currentStages,
                status: 'Completed',
                completionDate: new Date().toISOString().split('T')[0]
              });
            }
          }
        }
      }

      alert('Record saved successfully!');
      // Reset form fields that should be cleared
      setFormData(prev => ({
        ...prev,
        startTime: '',
        endTime: '',
        duration: '',
        qtyProduced: '',
        qtyScrap: '',
        remarks: ''
      }));
      setTimerStart(null);
    } catch (error) {
      console.error('Error saving record:', error);
      alert('Failed to save record.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white p-8 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-8 border-b border-gray-100 pb-6">
            <div>
              <h3 className="text-2xl font-serif italic text-gray-900">Workshop Execution</h3>
              <p className="mt-1 text-sm text-gray-500">
                Log production activities and track stage progress.
              </p>
            </div>
            {selectedWO && (
              <div className="text-right">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Current Work Order</span>
                <span className="text-lg font-mono font-bold text-[#f27d26]">{selectedWO.id}</span>
              </div>
            )}
          </div>

          <div className="mb-8 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
            <label htmlFor="workshop" className="block text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Active Workshop</label>
            <select 
              id="workshop" 
              name="workshop" 
              value={formData.workshop} 
              onChange={handleChange} 
              className="w-full border border-indigo-200 px-4 py-3 text-lg font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white rounded-md shadow-sm"
            >
              {workshops.map(w => (
                <option key={w._id} value={w.name}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Stage Progress Stepper */}
          {selectedWO && selectedWO.stages && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Process Flow: {selectedWO.process}</span>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {selectedWO.stages.filter(s => s.status === 'completed').length} / {selectedWO.stages.length} Stages
                </span>
              </div>
              <div className="flex gap-2">
                {selectedWO.stages.map((s, idx) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "h-1.5 flex-1 transition-colors",
                      s.status === 'completed' ? "bg-green-500" : 
                      s.status === 'current' ? "bg-[#f27d26] animate-pulse" : "bg-gray-200"
                    )}
                    title={`${s.name} (${s.status})`}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                <span>{selectedWO.stages[0].name}</span>
                <span>{selectedWO.stages[selectedWO.stages.length - 1].name}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="date" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Date</label>
              <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black" />
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="priority" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Priority</label>
              <select id="priority" name="priority" value={formData.priority} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white">
                <option value="1">1 - Normal</option>
                <option value="2">2 - High</option>
                <option value="3">3 - Urgent</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="machine" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Machine</label>
              <select id="machine" name="machine" value={formData.machine} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white">
                {machines.map(m => (
                  <option key={m._id} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="workorder" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Work Order</label>
              <select id="workorder" name="workorder" value={formData.workorder} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 text-sm font-bold text-[#f27d26] focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white">
                <option value="none">None (Maintenance/Setup)</option>
                {orders
                  .filter(o => o.status !== 'Completed')
                  .filter(o => {
                    if (!formData.workshop) return true;
                    const currentStage = o.stages?.find((s: any) => s.status === 'current');
                    return currentStage?.workshop === formData.workshop;
                  })
                  .map(wo => (
                    <option key={wo.id} value={wo.id}>{wo.id} - {wo.material} ({wo.process})</option>
                  ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="stage" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Active Stage</label>
              <select id="stage" name="stage" value={formData.stage} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white">
                {selectedWO && selectedWO.stages ? (
                  selectedWO.stages.map((s: any) => (
                    <option key={s.name} value={s.name}>{s.name} {s.status === 'current' ? '(Current)' : ''}</option>
                  ))
                ) : (
                  <option value="">N/A</option>
                )}
              </select>
            </div>

            {/* Routing Reference Info */}
            {currentRoutingInfo && (
              <div className="sm:col-span-6 grid grid-cols-3 gap-4 p-4 bg-gray-50 border border-gray-100 mb-2">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Std Time (min)</span>
                  <span className="text-sm font-mono font-bold text-gray-700">{currentRoutingInfo.stdTime || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Operators Req.</span>
                  <span className="text-sm font-mono font-bold text-gray-700">{currentRoutingInfo.operatorsRequired || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">QC Required</span>
                  <span className={cn(
                    "text-xs font-bold uppercase px-2 py-0.5 rounded-full",
                    currentRoutingInfo.qcRequired === 'Yes' ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-600"
                  )}>
                    {currentRoutingInfo.qcRequired || 'No'}
                  </span>
                </div>
              </div>
            )}

            <div className="sm:col-span-3">
              <label htmlFor="operator" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Operator</label>
              <select id="operator" name="operator" value={formData.operator} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white">
                {operators.map(o => (
                  <option key={o._id} value={o.name}>{o.name}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="status" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Task Status</label>
              <select id="status" name="status" value={formData.status} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white">
                <option>Under Process</option>
                <option>Completed</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="startTime" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Start Time</label>
              <input type="time" name="startTime" id="startTime" value={formData.startTime} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black" />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="endTime" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">End Time</label>
              <input type="time" name="endTime" id="endTime" value={formData.endTime} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black" />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="duration" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Duration (Hrs)</label>
              <input type="number" step="0.01" name="duration" id="duration" value={formData.duration} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black" />
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="qtyProduced" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Qty Produced</label>
              <input type="number" name="qtyProduced" id="qtyProduced" value={formData.qtyProduced} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black" />
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="qtyScrap" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Qty Scrap</label>
              <input type="number" name="qtyScrap" id="qtyScrap" value={formData.qtyScrap} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black" />
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="remarks" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Remarks / Notes</label>
              <textarea id="remarks" name="remarks" rows={3} value={formData.remarks} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black"></textarea>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex gap-3 w-full sm:w-auto">
              {!timerActive ? (
                <button 
                  type="button" 
                  onClick={handleStartTimer}
                  className="flex-1 sm:flex-none inline-flex justify-center items-center px-6 py-3 border border-transparent text-xs font-bold tracking-widest uppercase text-white bg-black hover:bg-gray-800 transition-colors"
                >
                  <Play className="h-4 w-4 mr-2" /> Start Timer
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={handleStopTimer}
                  className="flex-1 sm:flex-none inline-flex justify-center items-center px-6 py-3 border border-transparent text-xs font-bold tracking-widest uppercase text-white bg-red-600 hover:bg-red-700 animate-pulse transition-colors"
                >
                  <Square className="h-4 w-4 mr-2" /> Stop Timer
                </button>
              )}
            </div>
            
            <div className="flex gap-3 w-full sm:w-auto">
              <button 
                type="button" 
                onClick={() => setFormData({...formData, startTime: '', endTime: '', duration: '', qtyProduced: '', qtyScrap: '', remarks: ''})} 
                className="flex-1 sm:flex-none px-6 py-3 border border-gray-300 text-xs font-bold tracking-widest uppercase text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
              <button 
                type="submit" 
                className="flex-1 sm:flex-none inline-flex justify-center items-center px-6 py-3 border border-transparent text-xs font-bold tracking-widest uppercase text-white bg-[#f27d26] hover:bg-[#e06b15] transition-colors"
              >
                <Save className="h-4 w-4 mr-2" /> Save Record
              </button>
            </div>
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
