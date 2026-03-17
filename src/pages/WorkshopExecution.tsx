import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Factory, Play, Square, Save, Search, ChevronDown } from 'lucide-react';
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
  const [woSearch, setWoSearch] = useState('');
  const [isWoDropdownOpen, setIsWoDropdownOpen] = useState(false);
  const [workshopSearch, setWorkshopSearch] = useState('');
  const [isWorkshopDropdownOpen, setIsWorkshopDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const workshopDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsWoDropdownOpen(false);
      }
      if (workshopDropdownRef.current && !workshopDropdownRef.current.contains(event.target as Node)) {
        setIsWorkshopDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Set initial values from master data
  useEffect(() => {
    if (machines.length > 0 && !formData.machine) {
      setFormData(prev => ({ ...prev, machine: machines[0].name }));
    }
    if (operators.length > 0 && !formData.operator) {
      setFormData(prev => ({ ...prev, operator: operators[0].name }));
    }
  }, [machines, operators]);

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
      if (name === 'workshop') {
        if (prev.workorder !== 'none') {
          const order = orders.find(o => o.id === prev.workorder);
          const currentStage = order?.stages?.find((s: any) => s.status === 'current');
          const clean = (s: string) => s?.trim().toLowerCase() || '';
          const targetWorkshop = clean(value);
          
          const woWorkshop = clean(order?.workshop);
          const stageWorkshop = clean(currentStage?.workshop);
          const stageName = clean(currentStage?.name);

          const isMatch = (woWorkshop === targetWorkshop || stageWorkshop === targetWorkshop || stageName === targetWorkshop) ||
                         (targetWorkshop.length > 2 && (
                           (woWorkshop && (woWorkshop.includes(targetWorkshop) || targetWorkshop.includes(woWorkshop))) ||
                           (stageWorkshop && (stageWorkshop.includes(targetWorkshop) || targetWorkshop.includes(stageWorkshop))) ||
                           (stageName && (stageName.includes(targetWorkshop) || targetWorkshop.includes(stageName)))
                         ));
          
          if (!isMatch) {
            newData.workorder = 'none';
          }
        }
      }
      
      return newData;
    });
  };

  const filteredWorkshops = useMemo(() => {
    if (!workshopSearch) return workshops;
    const search = workshopSearch.toLowerCase();
    return workshops.filter(w => 
      (w.name?.toLowerCase() || '').includes(search) ||
      (w.stageName?.toLowerCase() || '').includes(search)
    );
  }, [workshops, workshopSearch]);

  const filteredWOOptions = useMemo(() => {
    const clean = (s: string) => s?.trim().toLowerCase() || '';
    const targetWorkshop = clean(formData.workshop);

    const availableOrders = orders
      .filter(o => o.status !== 'Completed' && o.status !== 'Canceled')
      .filter(o => {
        if (!targetWorkshop) return false;
        
        const currentStage = o.stages?.find((s: any) => s.status === 'current');
        const woWorkshop = clean(o.workshop);
        const stageWorkshop = clean(currentStage?.workshop);
        const stageName = clean(currentStage?.name);

        // 1. Exact matches
        if (woWorkshop === targetWorkshop || stageWorkshop === targetWorkshop || stageName === targetWorkshop) {
          return true;
        }
        
        // 2. Substring matches (e.g., "Machining" matches "Machining Workshop")
        // Only if strings are not empty to avoid false positives
        if (targetWorkshop.length > 2) {
          if (woWorkshop && (woWorkshop.includes(targetWorkshop) || targetWorkshop.includes(woWorkshop))) return true;
          if (stageWorkshop && (stageWorkshop.includes(targetWorkshop) || targetWorkshop.includes(stageWorkshop))) return true;
          if (stageName && (stageName.includes(targetWorkshop) || targetWorkshop.includes(stageName))) return true;
        }

        return false;
      });

    if (!woSearch) return availableOrders;
    
    const search = woSearch.toLowerCase();
    return availableOrders.filter(o => 
      (o.id?.toLowerCase() || '').includes(search) ||
      (o.material?.toLowerCase() || '').includes(search) ||
      (o.process?.toLowerCase() || '').includes(search)
    );
  }, [orders, formData.workshop, woSearch]);

  // Automatically select the first available Work Order when workshop changes
  useEffect(() => {
    if (filteredWOOptions.length > 0 && (formData.workorder === 'none' || !orders.find(o => o.id === formData.workorder))) {
      // Check if the current workorder is actually valid for this workshop
      const currentOrder = orders.find(o => o.id === formData.workorder);
      const isCurrentValid = currentOrder && filteredWOOptions.some(wo => wo.id === currentOrder.id);
      
      if (!isCurrentValid) {
        setFormData(prev => ({ ...prev, workorder: filteredWOOptions[0].id }));
      }
    }
  }, [formData.workshop, filteredWOOptions, orders]);

  const handleStartTimer = async () => {
    setTimerActive(true);
    setTimerStart(Date.now());
    const now = new Date();
    setFormData(prev => ({
      ...prev,
      startTime: now.toTimeString().slice(0, 5)
    }));

    // Update Work Order status to 'In Production' if a WO is selected
    if (selectedWO && selectedWO.status !== 'In Production') {
      try {
        await updateOrder(selectedWO.id, { status: 'In Production' });
      } catch (error) {
        console.error('Error updating WO status to In Production:', error);
      }
    }
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
      try {
        await addDoc(collection(db, 'workshop_records'), {
          ...formData,
          authorId: user.uid,
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        console.error('Error adding workshop record:', err);
        throw new Error(`Failed to save workshop record: ${err instanceof Error ? err.message : String(err)}`);
      }

      // Update Work Order status based on task status
      if (selectedWO) {
        try {
          if (formData.status === 'On Hold') {
            await updateOrder(selectedWO.id, { status: 'On Hold' });
          } else if (formData.status === 'Rejected') {
            await updateOrder(selectedWO.id, { status: 'Rejected' });
          } else if (formData.status === 'Under Process') {
            await updateOrder(selectedWO.id, { status: 'In Production' });
          }
        } catch (err) {
          console.error('Error updating Work Order status:', err);
          throw new Error(`Failed to update Work Order status: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

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
              try {
                await updateOrder(selectedWO.id, {
                  stages: currentStages,
                  stage: currentStages[currentIndex + 1].name,
                  workshop: currentStages[currentIndex + 1].workshop,
                  status: 'In Production'
                });
              } catch (err) {
                console.error('Error updating Work Order stages:', err);
                throw new Error(`Failed to update Work Order stages: ${err instanceof Error ? err.message : String(err)}`);
              }
            } else {
              // All stages completed
              try {
                await updateOrder(selectedWO.id, {
                  stages: currentStages,
                  status: 'Completed',
                  completionDate: new Date().toISOString().split('T')[0]
                });
              } catch (err) {
                console.error('Error completing Work Order:', err);
                throw new Error(`Failed to complete Work Order: ${err instanceof Error ? err.message : String(err)}`);
              }
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
    } catch (err: any) {
      console.error('Error saving record:', err);
      let errorMessage = 'Failed to save record.';
      try {
        const parsedError = JSON.parse(err.message);
        errorMessage = `Error: ${parsedError.error || err.message}`;
      } catch (e) {
        errorMessage = err.message || errorMessage;
      }
      alert(errorMessage);
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
          </div>

          <div className="mb-8 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
            <label htmlFor="workshop" className="block text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Active Workshop</label>
            <div className="relative" ref={workshopDropdownRef}>
              <div 
                className="w-full border border-indigo-200 px-4 py-3 text-lg font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white rounded-md shadow-sm cursor-pointer flex justify-between items-center"
                onClick={() => setIsWorkshopDropdownOpen(!isWorkshopDropdownOpen)}
              >
                <span>
                  {formData.workshop || 'Select Workshop...'}
                </span>
                <ChevronDown className={cn("h-5 w-5 text-indigo-400 transition-transform", isWorkshopDropdownOpen && "transform rotate-180")} />
              </div>

              {isWorkshopDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-indigo-200 shadow-xl rounded-md overflow-hidden">
                  <div className="p-2 border-b border-indigo-50 bg-indigo-50/30">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-indigo-400" />
                      <input
                        type="text"
                        className="w-full pl-8 pr-3 py-2 text-sm border border-indigo-100 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Search Workshop..."
                        value={workshopSearch}
                        onChange={(e) => setWorkshopSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {filteredWorkshops.length > 0 ? (
                      filteredWorkshops.map(w => (
                        <div 
                          key={w._id}
                          className={cn(
                            "px-4 py-3 text-base cursor-pointer hover:bg-indigo-50 border-b border-indigo-50 last:border-0",
                            formData.workshop === w.name && "bg-indigo-50 font-bold"
                          )}
                          onClick={() => {
                            handleChange({ target: { name: 'workshop', value: w.name } } as any);
                            setIsWorkshopDropdownOpen(false);
                            setWorkshopSearch('');
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <span>{w.name}</span>
                            {w.stageName && (
                              <span className="text-xs font-normal text-indigo-400 italic">({w.stageName})</span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-4 text-sm text-gray-400 italic text-center">
                        No workshops found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
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
              <div className="relative" ref={dropdownRef}>
                <div 
                  className="w-full border border-gray-300 px-3 py-2 text-sm font-bold text-[#f27d26] bg-white cursor-pointer flex justify-between items-center"
                  onClick={() => setIsWoDropdownOpen(!isWoDropdownOpen)}
                >
                  <span>
                    {formData.workorder === 'none' 
                      ? 'None (Maintenance/Setup)' 
                      : (orders.find(o => o.id === formData.workorder)?.id || 'Select Work Order')}
                  </span>
                  <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", isWoDropdownOpen && "transform rotate-180")} />
                </div>

                {isWoDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 shadow-lg rounded-md overflow-hidden">
                    <div className="p-2 border-b border-gray-100 bg-gray-50">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          className="w-full pl-8 pr-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="Search Work Order..."
                          value={woSearch}
                          onChange={(e) => setWoSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {filteredWOOptions.length > 0 ? (
                        <>
                          {filteredWOOptions.map(wo => (
                            <div 
                              key={wo.id}
                              className={cn(
                                "px-4 py-2 text-sm cursor-pointer hover:bg-indigo-50 border-b border-gray-50",
                                formData.workorder === wo.id && "bg-indigo-50 font-bold"
                              )}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, workorder: wo.id }));
                                setIsWoDropdownOpen(false);
                                setWoSearch('');
                              }}
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-[#f27d26] font-bold">{wo.id}</span>
                                <div className="flex gap-1">
                                  <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-bold rounded uppercase">
                                    {wo.stages?.find((s: any) => s.status === 'current')?.name || 'No Stage'}
                                  </span>
                                  <span className="text-[10px] text-gray-400 uppercase">{wo.process}</span>
                                </div>
                              </div>
                              <div className="text-[10px] text-gray-500 truncate">{wo.material}</div>
                            </div>
                          ))}
                          <div 
                            className={cn(
                              "px-4 py-2 text-sm cursor-pointer hover:bg-indigo-50 border-t-2 border-gray-100 mt-1 italic text-gray-500",
                              formData.workorder === 'none' && "bg-indigo-50 font-bold"
                            )}
                            onClick={() => {
                              setFormData(prev => ({ ...prev, workorder: 'none' }));
                              setIsWoDropdownOpen(false);
                              setWoSearch('');
                            }}
                          >
                            None (Maintenance/Setup)
                          </div>
                        </>
                      ) : (
                        <>
                          <div 
                            className={cn(
                              "px-4 py-2 text-sm cursor-pointer hover:bg-indigo-50",
                              formData.workorder === 'none' && "bg-indigo-50 font-bold"
                            )}
                            onClick={() => {
                              setFormData(prev => ({ ...prev, workorder: 'none' }));
                              setIsWoDropdownOpen(false);
                              setWoSearch('');
                            }}
                          >
                            None (Maintenance/Setup)
                          </div>
                          <div className="px-4 py-3 text-xs text-gray-400 italic text-center">
                            No matching work orders in this workshop
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

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
