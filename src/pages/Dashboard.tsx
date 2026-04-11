import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import { ClipboardList, CheckCircle, AlertTriangle, Package, LayoutDashboard, Calendar, Filter, Download, Play, CheckCircle2, Clock, Settings, History } from 'lucide-react';
import { cn } from '../lib/utils';
import { useWorkOrders } from '../context/WorkOrderContext';
import { useMasterData } from '../context/MasterDataContext';
import * as XLSX from 'xlsx';

function OverviewDashboard() {
  const { orders } = useWorkOrders();
  
  const openOrders = orders.filter(o => o.status !== 'Completed' && o.status !== 'Canceled').length;
  const completedToday = orders.filter(o => {
    if (o.status !== 'Completed' || !o.completionDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return o.completionDate.startsWith(today);
  }).length;
  
  const delayedOrders = orders.filter(o => {
    if (o.status === 'Completed' || o.status === 'Canceled') return false;
    const due = new Date(o.due);
    return due < new Date();
  }).length;

  const totalMaterial = orders.reduce((acc, o) => acc + (Number(o.weight) || 0), 0);

  // Production Trend (last 7 days)
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const productionTrend = last7Days.map(date => {
    const dayOrders = orders.filter(o => o.completionDate?.startsWith(date));
    const produced = dayOrders.reduce((acc, o) => acc + (Number(o.weight) || 0), 0);
    const plannedOrders = orders.filter(o => o.woDate?.startsWith(date) || o.start?.startsWith(date));
    const planned = plannedOrders.reduce((acc, o) => acc + (Number(o.weight) || 0), 0);
    
    return {
      name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      produced,
      planned,
      scrap: 0 // We don't have scrap data in the current model
    };
  });

  // Delivery Time (last 4 weeks)
  const deliveryTrend = [
    { name: 'Week 1', time: 0 },
    { name: 'Week 2', time: 0 },
    { name: 'Week 3', time: 0 },
    { name: 'Week 4', time: 0 },
  ];

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
                    <div className="text-2xl font-semibold text-gray-900">{openOrders}</div>
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
                    <div className="text-2xl font-semibold text-gray-900">{completedToday}</div>
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
                    <div className="text-2xl font-semibold text-gray-900">{delayedOrders}</div>
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
                    <div className="text-2xl font-semibold text-gray-900">{totalMaterial.toLocaleString()}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Daily Production Trend (kg)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productionTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="produced" fill="#4f46e5" name="Produced" />
                <Bar dataKey="planned" fill="#94a3b8" name="Planned" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Average Delivery Time (Days)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={deliveryTrend}>
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
    dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
  });

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchWorkshop = filters.workshop === 'All Workshops' || o.workshop === filters.workshop;
      const matchProcess = filters.process === 'All Processes' || o.process === filters.process;
      
      let matchDate = true;
      if (filters.dateFrom && filters.dateTo) {
        const orderDate = o.woDate || o.start || o.createdAt?.split('T')[0] || o.due;
        if (orderDate) {
          matchDate = orderDate >= filters.dateFrom && orderDate <= filters.dateTo;
        }
      }

      return matchWorkshop && matchProcess && matchDate;
    });
  }, [orders, filters]);

  const handleExport = () => {
    const exportData = filteredOrders.map(o => ({
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

  const statusCounts = filteredOrders.reduce((acc: any, o) => {
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

  const totalOrders = filteredOrders.length || 1;

  // Production Trend (based on date range)
  const dateRangeDays = useMemo(() => {
    if (!filters.dateFrom || !filters.dateTo) {
      return [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
      });
    }
    const start = new Date(filters.dateFrom);
    const end = new Date(filters.dateTo);
    const days = [];
    let current = new Date(start);
    while (current <= end) {
      days.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    if (days.length > 30) {
      return days.slice(-30);
    }
    return days;
  }, [filters.dateFrom, filters.dateTo]);

  const productionTrend = dateRangeDays.map(date => {
    const dayOrders = filteredOrders.filter(o => o.completionDate?.startsWith(date));
    const produced = dayOrders.reduce((acc, o) => acc + (Number(o.weight) || 0), 0);
    const plannedOrders = filteredOrders.filter(o => o.woDate?.startsWith(date) || o.start?.startsWith(date));
    const planned = plannedOrders.reduce((acc, o) => acc + (Number(o.weight) || 0), 0);
    
    return {
      name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      produced,
      planned
    };
  });

  const totalProduced = productionTrend.reduce((acc, p) => acc + p.produced, 0);
  const totalPlanned = productionTrend.reduce((acc, p) => acc + p.planned, 0);
  const outputVsPlan = totalPlanned > 0 ? Math.round((totalProduced / totalPlanned) * 100) + '%' : '0%';

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
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Active Work Orders', value: statusCounts['In Production'] + statusCounts['Not Started'], sub: 'Currently in progress', icon: ClipboardList, color: 'text-blue-400' },
          { label: 'Output vs Plan', value: outputVsPlan, sub: 'Completed vs planned qty', icon: Play, color: 'text-green-400' },
          { label: 'Rejection Rate', value: '0%', sub: 'Defects vs total quantity', icon: AlertTriangle, color: 'text-red-400' },
          { label: 'Machine Utilization', value: '0%', sub: 'Active vs total machines', icon: Settings, color: 'text-blue-400' },
          { label: 'Overtime Hours', value: '0 hrs', sub: 'Based on shift hours baseline', icon: History, color: 'text-yellow-400' },
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
              <BarChart data={productionTrend}>
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
            <p className="text-xs text-gray-500 italic">No rejection data available.</p>
          </div>
        </div>

        <div className="bg-[#1e293b] p-6 rounded-xl border border-gray-800">
          <h3 className="text-lg font-bold text-white mb-1">Machine Utilization by Workshop</h3>
          <p className="text-xs text-gray-500 mb-6">Active work orders per machine</p>
          <div className="overflow-x-auto">
            <p className="text-xs text-gray-500 italic">No machine data available.</p>
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
