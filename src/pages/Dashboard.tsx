import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import { ClipboardList, CheckCircle, AlertTriangle, Package, LayoutDashboard, Calendar, Filter, Download, Play, CheckCircle2, Clock, Settings, History } from 'lucide-react';
import { cn } from '../lib/utils';
import { useWorkOrders } from '../context/WorkOrderContext';
import { useMasterData } from '../context/MasterDataContext';
import * as XLSX from 'xlsx';

const productionData = [
  { name: 'Mon', produced: 4000, scrap: 240, planned: 4500 },
  { name: 'Tue', produced: 3000, scrap: 139, planned: 3500 },
  { name: 'Wed', produced: 2000, scrap: 980, planned: 2500 },
  { name: 'Thu', produced: 2780, scrap: 390, planned: 3000 },
  { name: 'Fri', produced: 1890, scrap: 480, planned: 2000 },
  { name: 'Sat', produced: 2390, scrap: 380, planned: 2500 },
  { name: 'Sun', produced: 3490, scrap: 430, planned: 4000 },
];

const deliveryData = [
  { name: 'Week 1', time: 4 },
  { name: 'Week 2', time: 3 },
  { name: 'Week 3', time: 5 },
  { name: 'Week 4', time: 2 },
];

function OverviewDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClipboardList className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Open Work Orders</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">124</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed Orders (Today)</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">18</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Delayed Orders</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">7</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-6 w-6 text-indigo-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Material Required (kg)</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">4,500</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Daily Production vs Scrap (kg)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="produced" fill="#4f46e5" name="Produced" />
                <Bar dataKey="scrap" fill="#ef4444" name="Scrap" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Average Delivery Time (Days)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={deliveryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="time" stroke="#10b981" name="Days" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function DailyDashboard() {
  const { orders } = useWorkOrders();
  const { workshops, processes } = useMasterData();
  const [filters, setFilters] = useState({
    workshop: 'All Workshops',
    process: 'All Processes',
    dateFrom: new Date().toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
  });

  const handleExport = () => {
    const exportData = orders.map(o => ({
      'WO No': o.id,
      'Material': o.material,
      'Workshop': o.workshop,
      'Status': o.status,
      'Due Date': o.due
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ProductionData");
    XLSX.writeFile(wb, "production_dashboard.xlsx");
  };

  const statusCounts = orders.reduce((acc: any, o) => {
    const status = o.status || 'Not Started';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {
    'Not Started': 0,
    'In Production': 0,
    'On Hold': 0,
    'Completed': 0,
    'Rejected': 0,
    'Canceled': 0
  });

  const totalOrders = orders.length || 1;

  return (
    <div className="bg-[#0f172a] min-h-screen p-6 text-gray-100 rounded-lg">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Production Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Real-time operational overview — CastFlow MES</p>
        </div>
        <button 
          onClick={handleExport}
          className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-700 flex items-center gap-2 text-sm transition-colors"
        >
          <Download className="h-4 w-4" /> Export to Excel
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[#1e293b] p-4 rounded-xl border border-gray-800 flex flex-wrap gap-4 items-end mb-8">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Workshop</label>
          <select 
            value={filters.workshop}
            onChange={e => setFilters({...filters, workshop: e.target.value})}
            className="w-full bg-[#0f172a] border border-gray-700 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option>All Workshops</option>
            {workshops.map(w => <option key={w._id}>{w.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Process Type</label>
          <select 
            value={filters.process}
            onChange={e => setFilters({...filters, process: e.target.value})}
            className="w-full bg-[#0f172a] border border-gray-700 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option>All Processes</option>
            {processes.map(p => <option key={p._id}>{p.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Date From</label>
          <input 
            type="date" 
            value={filters.dateFrom}
            onChange={e => setFilters({...filters, dateFrom: e.target.value})}
            className="w-full bg-[#0f172a] border border-gray-700 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none" 
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Date To</label>
          <input 
            type="date" 
            value={filters.dateTo}
            onChange={e => setFilters({...filters, dateTo: e.target.value})}
            className="w-full bg-[#0f172a] border border-gray-700 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none" 
          />
        </div>
        <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-md font-bold text-sm transition-colors">
          Apply Filters
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Active Work Orders', value: statusCounts['In Production'] + statusCounts['Not Started'], sub: 'Currently in progress', icon: ClipboardList, color: 'text-blue-400' },
          { label: 'Output vs Plan', value: '87.4%', sub: 'Completed vs planned qty', icon: Play, color: 'text-green-400' },
          { label: 'Rejection Rate', value: '3.2%', sub: 'Defects vs total quantity', icon: AlertTriangle, color: 'text-red-400' },
          { label: 'Machine Utilization', value: '76%', sub: 'Active vs total machines', icon: Settings, color: 'text-blue-400' },
          { label: 'Overtime Hours', value: '142 hrs', sub: 'Based on shift hours baseline', icon: History, color: 'text-yellow-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#1e293b] p-5 rounded-xl border border-gray-800">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
              <stat.icon className={cn("h-5 w-5", stat.color)} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">{stat.value}</h2>
            <p className="text-[10px] text-gray-500">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#1e293b] p-6 rounded-xl border border-gray-800">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Production Output Trend</h3>
              <p className="text-xs text-gray-500">Completed quantities over time</p>
            </div>
            <div className="flex gap-4 text-[10px] font-bold uppercase">
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /> Completed</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gray-600" /> Planned</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productionData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px'}}
                  itemStyle={{fontSize: '12px'}}
                />
                <Bar dataKey="produced" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="planned" fill="#334155" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#1e293b] p-6 rounded-xl border border-gray-800">
          <h3 className="text-lg font-bold text-white mb-1">Work Order Status Distribution</h3>
          <p className="text-xs text-gray-500 mb-6">Breakdown by current status</p>
          <div className="space-y-4">
            {[
              { label: 'Not Started', count: statusCounts['Not Started'], color: 'bg-gray-600' },
              { label: 'In Progress', count: statusCounts['In Production'], color: 'bg-blue-500' },
              { label: 'On Hold', count: statusCounts['On Hold'], color: 'bg-yellow-500' },
              { label: 'Completed', count: statusCounts['Completed'], color: 'bg-green-500' },
              { label: 'Rejected', count: statusCounts['Rejected'], color: 'bg-red-500' },
              { label: 'Cancelled', count: statusCounts['Canceled'], color: 'bg-gray-800' },
            ].map((status, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-xs text-gray-400 w-24">{status.label}</span>
                <div className="flex-1 h-2 bg-[#0f172a] rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full", status.color)} 
                    style={{ width: `${(status.count / totalOrders) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-white w-8 text-right">{status.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1e293b] p-6 rounded-xl border border-gray-800">
          <h3 className="text-lg font-bold text-white mb-1">Quality Rejection Breakdown</h3>
          <p className="text-xs text-gray-500 mb-6">Defect quantity by rejection reason</p>
          <div className="space-y-4">
            {[
              { label: 'Surface Defect', count: 24, color: 'bg-red-500' },
              { label: 'Dimensional Error', count: 12, color: 'bg-red-400' },
              { label: 'Material Impurity', count: 8, color: 'bg-red-300' },
              { label: 'Casting Void', count: 5, color: 'bg-red-200' },
            ].map((reason, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-xs text-gray-400 w-32">{reason.label}</span>
                <div className="flex-1 h-2 bg-[#0f172a] rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full", reason.color)} 
                    style={{ width: `${(reason.count / 50) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-white w-8 text-right">{reason.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1e293b] p-6 rounded-xl border border-gray-800">
          <h3 className="text-lg font-bold text-white mb-1">Machine Utilization by Workshop</h3>
          <p className="text-xs text-gray-500 mb-6">Active work orders per machine</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-500 uppercase font-bold border-b border-gray-800">
                  <th className="pb-3">Machine</th>
                  <th className="pb-3">Workshop</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Utilization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {[
                  { name: 'CNC-001', workshop: 'Workshop A', type: 'Centrifugal', util: 70 },
                  { name: 'CNC-002', workshop: 'Workshop B', type: 'Sand Casting', util: 85 },
                  { name: 'CNC-003', workshop: 'Workshop A', type: 'Centrifugal', util: 45 },
                  { name: 'CNC-004', workshop: 'Workshop C', type: 'Die Casting', util: 92 },
                ].map((m, i) => (
                  <tr key={i} className="hover:bg-[#0f172a] transition-colors">
                    <td className="py-4 font-bold text-white">{m.name}</td>
                    <td className="py-4 text-gray-400">{m.workshop}</td>
                    <td className="py-4 text-gray-400">{m.type}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-[#0f172a] rounded-full overflow-hidden min-w-[60px]">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${m.util}%` }} />
                        </div>
                        <span className="text-gray-400">{m.util}%</span>
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
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'daily'>('overview');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Overview of foundry operations and performance metrics.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              "px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2",
              activeTab === 'overview' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <LayoutDashboard className="h-4 w-4" /> Overview
          </button>
          <button
            onClick={() => setActiveTab('daily')}
            className={cn(
              "px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2",
              activeTab === 'daily' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Calendar className="h-4 w-4" /> Daily Dashboard
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? <OverviewDashboard /> : <DailyDashboard />}
    </div>
  );
}
