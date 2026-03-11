import React from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { CheckSquare, Check, X, AlertCircle } from 'lucide-react';

const tabs = [
  { name: 'Pending Inspection', path: 'pending' },
  { name: 'Inspection History', path: 'history' },
  { name: 'Quality Master Data', path: 'master' },
];

const mockPending = [
  { id: 'WO-2026-001', stage: 'Rough Machining', qty: 10, date: '2026-03-11', inspector: 'Unassigned' },
  { id: 'WO-2026-003', stage: 'Final Inspection', qty: 5, date: '2026-03-11', inspector: 'Unassigned' },
];

function PendingInspection() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {mockPending.map((item) => (
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
                  <span className="font-medium text-gray-900">{item.date}</span>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
                  <Check className="h-4 w-4 mr-2" /> Pass
                </button>
                <button className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700">
                  <X className="h-4 w-4 mr-2" /> Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlaceholderTab({ title }: { title: string }) {
  return (
    <div className="py-12 text-center">
      <CheckSquare className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">This module is under construction.</p>
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
            <Route path="history" element={<PlaceholderTab title="Inspection History" />} />
            <Route path="master" element={<PlaceholderTab title="Quality Master Data" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
