import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Factory, Play, Square, Save, Search, ChevronDown, RotateCcw, Calendar, Cpu, Users, UserCheck, Clock, ClipboardList, AlertCircle, X, User } from 'lucide-react';
import { useWorkOrders } from '../context/WorkOrderContext';
import { useMasterData } from '../context/MasterDataContext';
import { useFirebase } from '../context/FirebaseContext';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const tabs = [
  { name: 'Workshop Record', path: 'record' },
  { name: 'Workshop History', path: 'history' },
  { name: 'Workshop Logs', path: 'logs' },
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
    supervisor: '',
    shift: 'Day Shift',
    status: 'Under Process',
    startTime: '',
    endTime: '',
    duration: '',
    qtyProduced: '0',
    qtyScrap: 'Low',
    remarks: ''
  });

  const [timerActive, setTimerActive] = useState(false);
  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [woSearch, setWoSearch] = useState('');
  const [isWoDropdownOpen, setIsWoDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsWoDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        // Reset dependent fields
        newData.machine = '';
        newData.operator = '';
        
        // Auto-fill supervisor if available
        const selectedWorkshop = workshops.find(w => w.name === value);
        if (selectedWorkshop && selectedWorkshop.supervisor) {
          newData.supervisor = selectedWorkshop.supervisor;
        } else {
          newData.supervisor = '';
        }

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

      // If machine changes, auto-fill default operator
      if (name === 'machine') {
        const selectedMachine = machines.find(m => m.number === value);
        if (selectedMachine && selectedMachine.operator) {
          newData.operator = selectedMachine.operator;
        } else {
          newData.operator = '';
        }
      }

      if (name === 'startTime' || name === 'endTime') {
        const newStartTime = name === 'startTime' ? value : prev.startTime;
        const newEndTime = name === 'endTime' ? value : prev.endTime;
        
        if (newStartTime && newEndTime) {
          const [startH, startM] = newStartTime.split(':').map(Number);
          const [endH, endM] = newEndTime.split(':').map(Number);
          
          let diffMs = (endH * 60 + endM) * 60 * 1000 - (startH * 60 + startM) * 60 * 1000;
          if (diffMs < 0) {
            // Handle cross-midnight
            diffMs += 24 * 60 * 60 * 1000;
          }
          const diffHrs = (diffMs / (1000 * 60 * 60)).toFixed(2);
          newData.duration = diffHrs;
        }
      }

      if (name === 'duration') {
        if (prev.startTime && value) {
          const durationHrs = parseFloat(value);
          if (!isNaN(durationHrs)) {
            const [startH, startM] = prev.startTime.split(':').map(Number);
            const totalMs = (startH * 60 + startM) * 60 * 1000 + durationHrs * 60 * 60 * 1000;
            const endH = Math.floor(totalMs / (60 * 60 * 1000)) % 24;
            const endM = Math.floor((totalMs % (60 * 60 * 1000)) / (60 * 1000));
            newData.endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
          }
        }
      }
      
      return newData;
    });
  };

  const filteredMachines = useMemo(() => {
    if (!formData.workshop) return machines;
    return machines.filter(m => m.workshop === formData.workshop);
  }, [machines, formData.workshop]);

  const filteredOperators = useMemo(() => {
    if (!formData.workshop) return operators;
    return operators.filter(o => o.workshop === formData.workshop);
  }, [operators, formData.workshop]);

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
        const currentStage = selectedWO?.stages.find(s => s.name === formData.stage);
        const reworkCount = currentStage?.reworkCount || 0;
        
        await addDoc(collection(db, 'workshop_records'), {
          ...formData,
          authorId: user.uid,
          createdAt: new Date().toISOString(),
          isRework: reworkCount > 0,
          reworkCount: reworkCount
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

      // If status is "Complete", update the Work Order stages
      if (formData.status === 'Complete' && selectedWO) {
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
        qtyScrap: '0',
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
    <div className="max-w-[1200px] mx-auto font-condensed">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          LOG ACTIVITY: {formData.workshop || 'Select Workshop'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Sidebar: Context & Configuration (Left) */}
        <div className="md:col-span-4">
          <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-6 space-y-5">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-tight mb-4">
              CONTEXT & CONFIGURATION
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1">Date</label>
                <div className="relative">
                  <input 
                    type="date" 
                    name="date" 
                    value={formData.date} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:border-blue-500 focus:ring-0 transition-all font-condensed" 
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1">Workshop</label>
                <div className="relative">
                  <select 
                    name="workshop" 
                    value={formData.workshop} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm appearance-none focus:border-blue-500 focus:ring-0 font-condensed"
                  >
                    <option value="">Select Workshop...</option>
                    {workshops.map(w => <option key={w._id} value={w.name}>{w.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1">Machine</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                    <Factory className="h-3.5 w-3.5 text-gray-500" />
                  </div>
                  <select 
                    name="machine" 
                    value={formData.machine} 
                    onChange={handleChange} 
                    className="w-full pl-9 pr-8 py-2 bg-white border border-gray-300 rounded text-sm appearance-none focus:border-blue-500 focus:ring-0 font-condensed"
                  >
                    <option value="">Select Machine...</option>
                    {filteredMachines.map(m => <option key={m._id} value={m.number}>{m.number}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1">Shift</label>
                <div className="relative">
                  <select 
                    name="shift" 
                    value={formData.shift} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm appearance-none focus:border-blue-500 focus:ring-0 font-condensed"
                  >
                    <option>Day Shift</option>
                    <option>Night Shift</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1">Operator</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                    <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      <User className="h-3 w-3 text-gray-500" />
                    </div>
                  </div>
                  <select 
                    name="operator" 
                    value={formData.operator} 
                    onChange={handleChange} 
                    className="w-full pl-10 pr-8 py-2 bg-white border border-gray-300 rounded text-sm appearance-none focus:border-blue-500 focus:ring-0 font-condensed"
                  >
                    <option value="">Select Operator...</option>
                    {filteredOperators.map(o => <option key={o._id} value={o.name}>{o.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1">Supervisor</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                    <div className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center overflow-hidden">
                      <User className="h-3 w-3 text-pink-500" />
                    </div>
                  </div>
                  <select 
                    name="supervisor" 
                    value={formData.supervisor} 
                    onChange={handleChange} 
                    className="w-full pl-10 pr-8 py-2 bg-white border border-gray-300 rounded text-sm appearance-none focus:border-blue-500 focus:ring-0 font-condensed"
                  >
                    <option value="">Select Supervisor...</option>
                    {filteredOperators.map(o => <option key={o._id} value={o.name}>{o.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content: Activity Details (Right) */}
        <div className="md:col-span-8">
          <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-6 space-y-6">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-tight">
              ACTIVITY DETAILS
            </h2>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1">Priority</label>
                  <select 
                    name="priority" 
                    value={formData.priority} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm appearance-none focus:border-blue-500 focus:ring-0 font-condensed"
                  >
                    <option value="1">1 - Normal</option>
                    <option value="2">2 - High</option>
                    <option value="3">3 - Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1">Work Order</label>
                  <div className="relative" ref={dropdownRef}>
                    <div 
                      className={cn(
                        "w-full border px-3 py-2 rounded text-sm font-bold cursor-pointer flex justify-between items-center transition-all font-condensed",
                        formData.workorder === 'none' 
                          ? "bg-[#fffcf0] border-[#d4a017] text-[#b8860b]" 
                          : "bg-white border-gray-300 text-gray-900"
                      )}
                      onClick={() => setIsWoDropdownOpen(!isWoDropdownOpen)}
                    >
                      <span className="truncate">
                        {formData.workorder === 'none' ? 'None (Maintenance/Setup)' : (selectedWO?.id || 'Select Work Order')}
                      </span>
                      <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", isWoDropdownOpen && "rotate-180")} />
                    </div>

                    {isWoDropdownOpen && (
                      <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 shadow-xl rounded overflow-hidden">
                        <div className="p-2 border-b border-gray-100 bg-gray-50">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <input
                              type="text"
                              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded focus:border-blue-500 focus:ring-0 font-condensed"
                              placeholder="Search Work Order..."
                              value={woSearch}
                              onChange={(e) => setWoSearch(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          {filteredWOOptions.map(wo => (
                            <div 
                              key={wo.id}
                              className={cn(
                                "px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 transition-colors font-condensed",
                                formData.workorder === wo.id && "bg-blue-50 text-blue-700 font-bold"
                              )}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, workorder: wo.id }));
                                setIsWoDropdownOpen(false);
                              }}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-bold">{wo.id}</span>
                                <span className="text-[10px] opacity-50 uppercase">{wo.process}</span>
                              </div>
                            </div>
                          ))}
                          <div 
                            className="px-3 py-2 text-sm italic text-gray-500 hover:bg-gray-100 cursor-pointer font-condensed"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, workorder: 'none' }));
                              setIsWoDropdownOpen(false);
                            }}
                          >
                            None (Maintenance/Setup)
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1">Work Order Full Name</label>
                <div className="w-full px-3 py-2 bg-[#e9ecef] border border-gray-300 rounded text-sm font-bold text-gray-700 font-condensed">
                  {formData.workorder === 'none' ? 'None (Maintenance/Setup)' : (selectedWO ? `${selectedWO.id} - ${selectedWO.material}` : 'No Work Order Selected')}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1">Task Status</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        formData.status === 'Complete' ? "bg-green-500" : "bg-blue-600"
                      )} />
                    </div>
                    <select 
                      name="status" 
                      value={formData.status} 
                      onChange={handleChange} 
                      className="w-full pl-8 pr-8 py-2 bg-white border border-gray-300 rounded text-sm appearance-none focus:border-blue-500 focus:ring-0 font-condensed font-bold"
                    >
                      <option>Under Process</option>
                      <option>Complete</option>
                      <option>On Hold</option>
                      <option>Rejected</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1">Start Time</label>
                  <div className="flex gap-2">
                    <input 
                      type="time" 
                      name="startTime" 
                      value={formData.startTime} 
                      onChange={handleChange} 
                      onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                      className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:border-blue-500 focus:ring-0 font-condensed cursor-pointer" 
                    />
                    {!timerActive ? (
                      <button 
                        type="button" 
                        onClick={handleStartTimer}
                        className="px-3 bg-gray-800 text-white rounded hover:bg-black transition-colors"
                      >
                        <Play className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button 
                        type="button" 
                        onClick={handleStopTimer}
                        className="px-3 bg-red-600 text-white rounded hover:bg-red-700 animate-pulse transition-colors"
                      >
                        <Square className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1">Qty Produced</label>
                  <input 
                    type="number" 
                    name="qtyProduced" 
                    value={formData.qtyProduced} 
                    onChange={handleChange} 
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:border-blue-500 focus:ring-0 font-condensed" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1">Qty Scrap</label>
                  <input 
                    type="number" 
                    name="qtyScrap" 
                    value={formData.qtyScrap} 
                    onChange={handleChange} 
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:border-blue-500 focus:ring-0 font-condensed" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1 whitespace-nowrap">Duration (HRs)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.01"
                      name="duration" 
                      value={formData.duration} 
                      onChange={handleChange}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:border-blue-500 focus:ring-0 font-condensed" 
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 font-condensed">HRS</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1">End Time</label>
                  <div className="relative">
                    <input 
                      type="time" 
                      name="endTime" 
                      value={formData.endTime} 
                      onChange={handleChange} 
                      onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:border-blue-500 focus:ring-0 font-condensed cursor-pointer" 
                    />
                    <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1 uppercase">OPERATOR NOTES</label>
                <textarea 
                  name="remarks" 
                  rows={2} 
                  value={formData.remarks} 
                  onChange={handleChange} 
                  placeholder="Add detailed observations here..."
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:border-blue-500 focus:ring-0 transition-all font-condensed"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-[#2b5ba9] text-white rounded text-sm font-bold hover:bg-[#244d8f] transition-all shadow-sm flex items-center gap-2 font-condensed uppercase"
                >
                  Record Activity
                </button>
                <button 
                  type="button" 
                  onClick={() => setFormData({...formData, startTime: '', endTime: '', duration: '', qtyProduced: '', qtyScrap: '0', remarks: ''})}
                  className="px-6 py-2 bg-[#e9ecef] border border-gray-300 rounded text-sm font-bold text-gray-700 hover:bg-gray-300 transition-all font-condensed uppercase"
                >
                  Cancel
                </button>
              </div>
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
    <div className="space-y-4 font-condensed">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Recent Activity Logs</h2>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Complete
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 uppercase">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            In Progress
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {records.map((record) => (
          <div key={record.id} className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden flex flex-col md:flex-row">
            {/* Status Bar */}
            <div className={cn(
              "w-full md:w-1.5",
              record.status === 'Complete' || record.status === 'Completed' ? "bg-green-500" : "bg-blue-600"
            )} />
            
            <div className="flex-1 p-4 flex flex-col md:flex-row md:items-center gap-6">
              {/* Context Info */}
              <div className="min-w-[200px]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Workshop</span>
                  <span className="text-xs font-bold text-gray-900 uppercase">{record.workshop}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Factory className="h-3 w-3 text-gray-400" />
                  <span className="text-xs font-bold text-gray-700">{record.machine}</span>
                  <span className="text-[10px] text-gray-400">|</span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{record.shift}</span>
                </div>
              </div>

              {/* Work Order Info */}
              <div className="flex-1 border-l border-gray-100 pl-6">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1">Activity / Work Order</div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                    record.workorder !== 'none' ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-[#fffcf0] text-[#b8860b] border border-[#d4a017]"
                  )}>
                    {record.workorder !== 'none' ? record.workorder : 'Maint/Setup'}
                  </span>
                  <span className="text-xs font-bold text-gray-900 truncate max-w-[200px]">
                    {record.status}
                  </span>
                </div>
              </div>

              {/* Metrics */}
              <div className="flex items-center gap-8 border-l border-gray-100 pl-6">
                <div className="text-center">
                  <div className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Produced</div>
                  <div className="text-sm font-black text-gray-900">{record.qtyProduced || 0}</div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Scrap</div>
                  <div className="text-sm font-black text-red-600">{record.qtyScrap || 0}</div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Duration</div>
                  <div className="text-sm font-black text-gray-900">{record.duration || '0.0'} <span className="text-[10px] font-normal text-gray-400">HRS</span></div>
                </div>
              </div>

              {/* Personnel */}
              <div className="border-l border-gray-100 pl-6 hidden xl:block">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="h-2.5 w-2.5 text-gray-500" />
                  </div>
                  <span className="text-xs font-bold text-gray-700">{record.operator}</span>
                </div>
                {record.supervisor && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-pink-50 flex items-center justify-center">
                      <User className="h-2.5 w-2.5 text-pink-500" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-500">{record.supervisor}</span>
                  </div>
                )}
              </div>

              {/* Time */}
              <div className="ml-auto text-right">
                <div className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">{record.date}</div>
                <div className="text-xs font-bold text-gray-600">{record.startTime} - {record.endTime}</div>
              </div>
            </div>
          </div>
        ))}

        {records.length === 0 && (
          <div className="bg-white border border-gray-200 border-dashed rounded-lg p-12 text-center">
            <ClipboardList className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No activity records found for this period</p>
          </div>
        )}
      </div>
    </div>
  );
}

function WorkshopLogs() {
  const [records, setRecords] = useState<any[]>([]);
  const { user, isAuthReady } = useFirebase();
  const [filterWO, setFilterWO] = useState('');
  const [filterWorkshop, setFilterWorkshop] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

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

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const matchWO = filterWO === '' || (record.workorder && record.workorder.toLowerCase().includes(filterWO.toLowerCase()));
      const matchWorkshop = filterWorkshop === '' || (record.workshop && record.workshop.toLowerCase().includes(filterWorkshop.toLowerCase()));
      const matchStatus = filterStatus === '' || record.status === filterStatus;
      return matchWO && matchWorkshop && matchStatus;
    });
  }, [records, filterWO, filterWorkshop, filterStatus]);

  const uniqueWorkshops = useMemo(() => {
    const workshops = new Set(records.map(r => r.workshop).filter(Boolean));
    return Array.from(workshops).sort();
  }, [records]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(records.map(r => r.status).filter(Boolean));
    return Array.from(statuses).sort();
  }, [records]);

  return (
    <div className="space-y-4 font-condensed">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-900 mb-1">Filter by Work Order</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={filterWO}
              onChange={(e) => setFilterWO(e.target.value)}
              placeholder="Search Work Order..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded text-sm focus:border-blue-500 focus:ring-0"
            />
          </div>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-900 mb-1">Filter by Workshop</label>
          <div className="relative">
            <select
              value={filterWorkshop}
              onChange={(e) => setFilterWorkshop(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-white border border-gray-300 rounded text-sm appearance-none focus:border-blue-500 focus:ring-0"
            >
              <option value="">All Workshops</option>
              {uniqueWorkshops.map(w => <option key={w as string} value={w as string}>{w as string}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-900 mb-1">Filter by Status</label>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-white border border-gray-300 rounded text-sm appearance-none focus:border-blue-500 focus:ring-0"
            >
              <option value="">All Statuses</option>
              {uniqueStatuses.map(s => <option key={s as string} value={s as string}>{s as string}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Work Order</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Workshop</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Machine</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Operator</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Shift</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Duration</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Produced</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Scrap</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{record.workorder !== 'none' ? record.workorder : 'Maint/Setup'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.workshop}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.machine}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.operator}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.shift}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                      record.status === 'Complete' || record.status === 'Completed' ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                    )}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.duration || '0.0'} hrs</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.qtyProduced || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{record.qtyScrap || 0}</td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-sm text-gray-500">
                    No records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function WorkshopExecution() {
  return (
    <div className="space-y-6 bg-[#f8f9fa] min-h-screen p-6 font-condensed">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-gray-900">Workshop Execution</h1>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Production Control & Activity Logging</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <div className="border-b border-gray-200 bg-white">
          <nav className="flex px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <NavLink
                key={tab.name}
                to={`/workshop/${tab.path}`}
                className={({ isActive }) =>
                  cn(
                    "whitespace-nowrap py-4 px-6 border-b-2 font-bold text-xs uppercase tracking-widest transition-all",
                    isActive
                      ? 'border-[#2b5ba9] text-[#2b5ba9]'
                      : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
                  )
                }
              >
                {tab.name}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="p-8 bg-[#f8f9fa]">
          <Routes>
            <Route path="/" element={<Navigate to="record" replace />} />
            <Route path="record" element={<WorkshopRecord />} />
            <Route path="history" element={<WorkshopHistory />} />
            <Route path="logs" element={<WorkshopLogs />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
