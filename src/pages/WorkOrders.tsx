import React, { useState } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Plus, Search, Download, Upload, Edit, Trash2, FileText, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useWorkOrders } from '../context/WorkOrderContext';
import { useMasterData } from '../context/MasterDataContext';

const tabs = [
  { name: 'Create Work Order', path: 'create' },
  { name: 'Open Work Orders', path: 'open' },
  { name: 'Work Order History', path: 'history' },
];

function OpenOrdersList({ orders }: { orders: any[] }) {
  const [searchId, setSearchId] = useState('');
  const [searchMaterial, setSearchMaterial] = useState('');
  const [searchStatus, setSearchStatus] = useState('');

  const filteredOrders = orders.filter(order => {
    const matchId = order.id.toLowerCase().includes(searchId.toLowerCase());
    const matchMaterial = order.material.toLowerCase().includes(searchMaterial.toLowerCase());
    const matchStatus = searchStatus === '' || order.status === searchStatus;
    return matchId && matchMaterial && matchStatus;
  });

  const handleExport = () => {
    if (filteredOrders.length === 0) {
      console.warn("No data to export");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(filteredOrders);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Work Orders");
    XLSX.writeFile(workbook, "work_orders.xlsx");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto flex-1">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search WO No..."
            />
          </div>
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchMaterial}
              onChange={(e) => setSearchMaterial(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search Material..."
            />
          </div>
          <select
            value={searchStatus}
            onChange={(e) => setSearchStatus(e.target.value)}
            className="block w-full sm:w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white"
          >
            <option value="">All Statuses</option>
            <option value="Planned">Planned</option>
            <option value="In Production">In Production</option>
            <option value="Completed">Completed</option>
            <option value="Canceled">Canceled</option>
          </select>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={handleExport}
            className="w-full sm:w-auto inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
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
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WO No</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Process</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dimensions</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">{order.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.material}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.process}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.dimensions}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.qty}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.stage}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={cn(
                          "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                          order.status === 'In Production' ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"
                        )}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button className="text-indigo-600 hover:text-indigo-900"><Edit className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateWorkOrder({ onAddOrder }: { onAddOrder: (orders: any[]) => void }) {
  const navigate = useNavigate();
  const { materials, castingTypes, routing } = useMasterData();
  const [header, setHeader] = useState({
    workOrderNo: '',
    priority: '1 - Normal',
    startDate: '',
    atpDate: '',
    dueDate: '',
  });

  const [lines, setLines] = useState([{
    id: crypto.randomUUID(),
    product: 'Bars',
    material: 'BRZ-01 (Bronze C93200)',
    processType: 'Continuous Casting',
    routing: 'Standard Routing',
    od: '',
    innerId: '',
    length: '',
    quantity: '1',
    mold: '',
    approxWeight: '',
    dimensionNotes: '',
    commentNotes: '',
  }]);

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setHeader({ ...header, [e.target.name]: e.target.value });
  };

  const handleLineChange = (id: string, field: string, value: string) => {
    setLines(lines.map(line => line.id === id ? { ...line, [field]: value } : line));
  };

  const addLine = () => {
    setLines([...lines, {
      id: crypto.randomUUID(),
      product: 'Bars',
      material: 'BRZ-01 (Bronze C93200)',
      processType: 'Continuous Casting',
      routing: 'Standard Routing',
      od: '',
      innerId: '',
      length: '',
      quantity: '1',
      mold: '',
      approxWeight: '',
      dimensionNotes: '',
      commentNotes: '',
    }]);
  };

  const removeLine = (id: string) => {
    if (lines.length > 1) {
      setLines(lines.filter(line => line.id !== id));
    }
  };

  const calculateWeight = (line: any) => {
    const density = 0.0000088; // kg/mm³ for Bronze
    let volume = 0;
    
    const od = Number(line.od) || 0;
    const id = Number(line.innerId) || 0;
    const length = Number(line.length) || 0;
    const qty = Number(line.quantity) || 1;
    const approxWeight = Number(line.approxWeight) || 0;
    
    if (line.product === 'Bushings' || id > 0) {
      volume = Math.PI * (Math.pow(od / 2, 2) - Math.pow(id / 2, 2)) * length;
    } else {
      volume = Math.PI * Math.pow(od / 2, 2) * length;
    }
    
    if (volume < 0) volume = 0;
    
    const unitWeight = volume * density;
    const totalWeight = unitWeight * qty;
    const rawMaterialReq = totalWeight * 1.15; // +15%
    
    const weightBasedOnMold = approxWeight * qty;
    
    return {
      unitWeight: unitWeight.toFixed(2),
      totalWeight: totalWeight.toFixed(2),
      rawMaterialReq: rawMaterialReq.toFixed(2),
      weightBasedOnMold: weightBasedOnMold.toFixed(2),
      hasMold: !!line.mold && line.mold.trim() !== ''
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newOrders = lines.map((line, index) => {
      const weights = calculateWeight(line);
      const woId = header.workOrderNo || `WO-2026-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}-${index + 1}`;
      
      let dimensions = `OD: ${line.od || 0}`;
      if (line.innerId) dimensions += `, ID: ${line.innerId}`;
      if (line.length) dimensions += `, L: ${line.length}`;
      
      const finalWeight = weights.hasMold ? Number(weights.weightBasedOnMold) : Number(weights.totalWeight);
      
      return {
        id: woId,
        material: line.material.split(' ')[0], // Get just the code part
        process: line.processType,
        routeId: line.routing,
        dimensions: dimensions,
        qty: Number(line.quantity) || 1,
        weight: finalWeight,
        stage: 'Planned',
        workshop: 'Foundry A',
        start: header.startDate || new Date().toISOString().split('T')[0],
        due: header.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: header.priority.split(' - ')[1] || 'Normal',
        status: 'Planned'
      };
    });

    try {
      await onAddOrder(newOrders);
      navigate('/work-orders/open');
    } catch (error) {
      console.error("Failed to add orders", error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <form className="space-y-8" onSubmit={handleSubmit}>
        {/* Order Header Section */}
        <div className="bg-[#FAF9F6] p-4 sm:p-8 border border-gray-200 shadow-sm">
          <h2 className="text-2xl sm:text-3xl font-serif italic text-gray-900 mb-6 border-b border-gray-200 pb-4">Order Header</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Work Order No</label>
              <input 
                type="text" 
                name="workOrderNo"
                value={header.workOrderNo}
                onChange={handleHeaderChange}
                placeholder="Auto-generated if empty" 
                className="w-full border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Priority</label>
              <select 
                name="priority"
                value={header.priority}
                onChange={handleHeaderChange}
                className="w-full border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 bg-white"
              >
                <option>1 - Normal</option>
                <option>2 - High</option>
                <option>3 - Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Start Date</label>
              <input 
                type="date" 
                name="startDate"
                value={header.startDate}
                onChange={handleHeaderChange}
                className="w-full border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">ATP Date</label>
              <input 
                type="date" 
                name="atpDate"
                value={header.atpDate}
                onChange={handleHeaderChange}
                className="w-full border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Due Date</label>
              <input 
                type="date" 
                name="dueDate"
                value={header.dueDate}
                onChange={handleHeaderChange}
                className="w-full border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Order Lines Section */}
        <div className="bg-[#FAF9F6] p-4 sm:p-8 border border-gray-200 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-gray-200 pb-4">
            <h2 className="text-2xl sm:text-3xl font-serif italic text-gray-900">Order Lines</h2>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button type="button" className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-gray-900 text-xs sm:text-sm font-bold tracking-wider uppercase hover:bg-gray-100 transition-colors">
                <Download className="w-4 h-4" /> <span className="hidden sm:inline">Template</span>
              </button>
              <button type="button" className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-gray-900 text-xs sm:text-sm font-bold tracking-wider uppercase hover:bg-gray-100 transition-colors">
                <Upload className="w-4 h-4" /> <span className="hidden sm:inline">Upload Excel</span>
              </button>
              <button type="button" onClick={addLine} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#141414] text-white text-xs sm:text-sm font-bold tracking-wider uppercase hover:bg-black transition-colors">
                <Plus className="w-4 h-4" /> Add Line
              </button>
            </div>
          </div>

          <div className="space-y-8">
            {lines.map((line, index) => {
              const weights = calculateWeight(line);
              
              return (
                <div key={line.id} className="bg-white border border-gray-200 shadow-sm relative">
                  {lines.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeLine(line.id)}
                      className="absolute -right-3 -top-3 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md z-10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Product</label>
                        <select 
                          value={line.product}
                          onChange={(e) => handleLineChange(line.id, 'product', e.target.value)}
                          className="w-full border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 bg-white"
                        >
                          <option>Bars</option>
                          <option>Bushings</option>
                          <option>Plates</option>
                          <option>Custom</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Material</label>
                        <select 
                          value={line.material}
                          onChange={(e) => handleLineChange(line.id, 'material', e.target.value)}
                          className="w-full border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 bg-white"
                        >
                          {materials.map(m => (
                            <option key={m._id} value={m.name}>{m.name}</option>
                          ))}
                          {materials.length === 0 && (
                            <>
                              <option>BRZ-01 (Bronze C93200)</option>
                              <option>BRZ-02 (Alum Bronze)</option>
                            </>
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Process Type</label>
                        <select 
                          value={line.processType}
                          onChange={(e) => handleLineChange(line.id, 'processType', e.target.value)}
                          className="w-full border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 bg-white"
                        >
                          {castingTypes.map(ct => (
                            <option key={ct._id} value={ct.name}>{ct.name}</option>
                          ))}
                          {castingTypes.length === 0 && (
                            <>
                              <option>Continuous Casting</option>
                              <option>Sand Casting</option>
                              <option>Centrifugal</option>
                            </>
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Routing</label>
                        <select 
                          value={line.routing}
                          onChange={(e) => handleLineChange(line.id, 'routing', e.target.value)}
                          className="w-full border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 bg-white"
                        >
                          {/* Unique Route IDs */}
                          {Array.from(new Set(routing.map(r => r.routeId))).map(routeId => (
                            <option key={routeId} value={routeId}>{routeId}</option>
                          ))}
                          {routing.length === 0 && (
                            <>
                              <option>Standard Routing</option>
                              <option>Custom Routing A</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 p-4 bg-gray-50 border border-gray-100">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">OD (MM)</label>
                        <input 
                          type="number" 
                          value={line.od}
                          onChange={(e) => handleLineChange(line.id, 'od', e.target.value)}
                          className="w-full border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">ID (MM)</label>
                        <input 
                          type="number" 
                          value={line.innerId}
                          onChange={(e) => handleLineChange(line.id, 'innerId', e.target.value)}
                          className="w-full border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Length (MM)</label>
                        <input 
                          type="number" 
                          value={line.length}
                          onChange={(e) => handleLineChange(line.id, 'length', e.target.value)}
                          className="w-full border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Quantity</label>
                        <input 
                          type="number" 
                          value={line.quantity}
                          onChange={(e) => handleLineChange(line.id, 'quantity', e.target.value)}
                          className="w-full border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mold #</label>
                        <input 
                          type="text" 
                          value={line.mold}
                          onChange={(e) => handleLineChange(line.id, 'mold', e.target.value)}
                          className="w-full border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Dimension Notes</label>
                        <input 
                          type="text" 
                          value={line.dimensionNotes}
                          onChange={(e) => handleLineChange(line.id, 'dimensionNotes', e.target.value)}
                          className="w-full border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Comment Notes</label>
                        <input 
                          type="text" 
                          value={line.commentNotes}
                          onChange={(e) => handleLineChange(line.id, 'commentNotes', e.target.value)}
                          className="w-full border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Weight <span className="text-red-500">*</span></label>
                        <input 
                          type="number" 
                          required
                          value={line.approxWeight}
                          onChange={(e) => handleLineChange(line.id, 'approxWeight', e.target.value)}
                          className="w-full border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Weight Footer */}
                  <div className="bg-[#141414] text-white p-6 flex flex-wrap gap-12 items-center">
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Unit Weight</div>
                      <div className="text-xl font-mono font-bold">{weights.unitWeight} KG</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Weight</div>
                      <div className="text-xl font-mono font-bold">{weights.totalWeight} KG</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Raw Material Req (+15%)</div>
                      <div className="text-xl font-mono font-bold text-[#F27D26]">{weights.rawMaterialReq} KG</div>
                    </div>
                    {weights.hasMold && (
                      <div>
                        <div className="text-[10px] font-bold text-[#F27D26] uppercase tracking-wider mb-1">Weight Based on Mold</div>
                        <div className="text-xl font-mono font-bold text-[#F27D26]">{weights.weightBasedOnMold} KG</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
          <button 
            type="button" 
            onClick={() => navigate('/work-orders/open')}
            className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-sm font-bold tracking-wider uppercase hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="w-full sm:w-auto px-6 py-3 bg-[#141414] text-white text-sm font-bold tracking-wider uppercase hover:bg-black transition-colors"
          >
            Save Work Order
          </button>
        </div>
      </form>
    </div>
  );
}

function WorkOrderHistory({ orders }: { orders: any[] }) {
  const [searchId, setSearchId] = useState('');
  const [searchMaterial, setSearchMaterial] = useState('');
  const [searchStatus, setSearchStatus] = useState('');

  const filteredOrders = orders.filter(order => {
    const matchId = order.id.toLowerCase().includes(searchId.toLowerCase());
    const matchMaterial = order.material.toLowerCase().includes(searchMaterial.toLowerCase());
    const matchStatus = searchStatus === '' || order.status === searchStatus;
    return matchId && matchMaterial && matchStatus;
  });

  const calculateDays = (start: string, completionDate?: string, status?: string) => {
    if (status === 'Canceled') return '-';
    const startDate = new Date(start);
    const endDate = completionDate ? new Date(completionDate) : new Date();
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : 0;
  };

  const calculateDelay = (due: string, deliveryDate?: string, status?: string) => {
    if (status === 'Canceled') return '-';
    const dueDate = new Date(due);
    if (!deliveryDate) {
      const today = new Date();
      if (today > dueDate) {
        const diffTime = today.getTime() - dueDate.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
      return 0;
    } else {
      const delDate = new Date(deliveryDate);
      if (delDate > dueDate) {
        const diffTime = delDate.getTime() - dueDate.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
      return 0;
    }
  };

  const handleExport = () => {
    if (filteredOrders.length === 0) {
      console.warn("No data to export");
      return;
    }

    const exportData = filteredOrders.map(order => ({
      'Creation Date': order.createdAt || order.start,
      'Work Order Number': order.id,
      'Product Type': order.productType || '-',
      'Start Date': order.start,
      'Due Date': order.due,
      'Apt Date': order.aptDate || '-',
      'Dimensions': order.dimensions,
      'Quantity': order.qty,
      'Expected Weight': order.weight,
      'Actual Produced Weight': order.actualWeight || '-',
      'Delivery Date': order.deliveryDate || '-',
      'Completion Date': order.completionDate || '-',
      'Quality Approval Status': order.qualityStatus || '-',
      'Final Process Used': order.process,
      'Stage': order.stage,
      'No of Days': calculateDays(order.start, order.completionDate, order.status),
      'Delay Days': calculateDelay(order.due, order.deliveryDate, order.status)
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Work Order History");
    XLSX.writeFile(workbook, "work_order_history.xlsx");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search WO No..."
            />
          </div>
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchMaterial}
              onChange={(e) => setSearchMaterial(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search Material..."
            />
          </div>
          <select
            value={searchStatus}
            onChange={(e) => setSearchStatus(e.target.value)}
            className="block w-full sm:w-48 pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white"
          >
            <option value="">All Statuses</option>
            <option value="Planned">Planned</option>
            <option value="In Production">In Production</option>
            <option value="Completed">Completed</option>
            <option value="Canceled">Canceled</option>
          </select>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={handleExport}
            className="w-full sm:w-auto inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
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
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creation Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WO No</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apt Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dimensions</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Wt</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Wt</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Final Process</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No of Days</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delay Days</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => {
                    const delayDays = calculateDelay(order.due, order.deliveryDate, order.status);
                    return (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.createdAt || order.start}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">{order.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.productType || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.start}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.due}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.aptDate || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.dimensions}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.qty}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.weight}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.actualWeight || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.deliveryDate || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.completionDate || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={cn(
                            "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                            order.qualityStatus === 'Approved' ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          )}>
                            {order.qualityStatus || 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.process}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.stage}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{calculateDays(order.start, order.completionDate, order.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={cn(
                            "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                            typeof delayDays === 'number' && delayDays > 0 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                          )}>
                            {delayDays}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkOrders() {
  const { orders, addOrders } = useWorkOrders();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Work Orders</h1>
        <p className="mt-1 text-sm text-gray-500">Manage production demand and order tracking.</p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => (
              <NavLink
                key={tab.name}
                to={`/work-orders/${tab.path}`}
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
            <Route path="/" element={<Navigate to="create" replace />} />
            <Route path="open" element={<OpenOrdersList orders={orders} />} />
            <Route path="create" element={<CreateWorkOrder onAddOrder={addOrders} />} />
            <Route path="history" element={<WorkOrderHistory orders={orders} />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
