import React from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { CalendarDays, Play, ArrowRight, ArrowLeft, RotateCcw } from 'lucide-react';

const tabs = [
  { name: 'Work Order Execution', path: 'execution' },
  { name: 'Weekly Production Plan', path: 'weekly' },
  { name: 'Capacity Calculation', path: 'capacity' },
  { name: 'Routing', path: 'routing' },
  { name: 'Gantt Chart', path: 'gantt' },
];

const mockExecution = [
  { 
    id: 'WO-2026-001', 
    name: 'Bronze Bushing C93200', 
    stages: [
      { name: 'Material Prep', status: 'completed' },
      { name: 'Furnace Melting', status: 'completed' },
      { name: 'Centrifugal Casting', status: 'current' },
      { name: 'Cooling', status: 'pending' },
      { name: 'Rough Machining', status: 'pending' },
      { name: 'Final Machining', status: 'pending' },
      { name: 'Inspection', status: 'pending' },
    ]
  },
];

function WorkOrderExecution() {
  return (
    <div className="space-y-6">
      {mockExecution.map((wo) => (
        <div key={wo.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">{wo.id}</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">{wo.name}</p>
            </div>
            <div className="flex gap-2">
              <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                <Play className="h-3 w-3 mr-1" /> Start Stage
              </button>
              <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700">
                <ArrowRight className="h-3 w-3 mr-1" /> Next Stage
              </button>
              <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50">
                <ArrowLeft className="h-3 w-3 mr-1" /> Prev Stage
              </button>
              <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700">
                <RotateCcw className="h-3 w-3 mr-1" /> Rework
              </button>
            </div>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              {wo.stages.map((stage, index) => (
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
                      "flex-1 h-0.5 mx-2",
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
                to={tab.path}
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
          </Routes>
        </div>
      </div>
    </div>
  );
}
