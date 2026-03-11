import React from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Factory, Play, Square, Save } from 'lucide-react';

const tabs = [
  { name: 'Workshop Record', path: 'record' },
  { name: 'Workshop History', path: 'history' },
];

function WorkshopRecord() {
  return (
    <div className="max-w-3xl mx-auto">
      <form className="space-y-8 divide-y divide-gray-200">
        <div className="space-y-8 divide-y divide-gray-200">
          <div>
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">New Workshop Task Record</h3>
              <p className="mt-1 text-sm text-gray-500">
                Log production activities, machine time, and material usage.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
                <div className="mt-1">
                  <input type="date" name="date" id="date" defaultValue={new Date().toISOString().split('T')[0]} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
                <div className="mt-1">
                  <select id="priority" name="priority" className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                    <option value="1">1 - Normal</option>
                    <option value="2">2 - High</option>
                    <option value="3">3 - Urgent</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="workshop" className="block text-sm font-medium text-gray-700">Workshop Name</label>
                <div className="mt-1">
                  <select id="workshop" name="workshop" className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                    <option>Foundry A</option>
                    <option>Foundry B</option>
                    <option>Machining Shop</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="machine" className="block text-sm font-medium text-gray-700">Machine</label>
                <div className="mt-1">
                  <select id="machine" name="machine" className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                    <option>Furnace F-01</option>
                    <option>Centrifugal C-02</option>
                    <option>Lathe L-05</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="workorder" className="block text-sm font-medium text-gray-700">Work Order</label>
                <div className="mt-1">
                  <select id="workorder" name="workorder" className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                    <option>WO-2026-001 - Bronze Bushing C93200</option>
                    <option>WO-2026-002 - Aluminum Bronze C95400</option>
                    <option>None (Maintenance/Setup)</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="operator" className="block text-sm font-medium text-gray-700">Operator</label>
                <div className="mt-1">
                  <select id="operator" name="operator" className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                    <option>Ahmed Hassan</option>
                    <option>Mohamed Ali</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">
                  <select id="status" name="status" className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                    <option>Under Process</option>
                    <option>Completed</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">Start Time</label>
                <div className="mt-1">
                  <input type="time" name="startTime" id="startTime" className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">End Time</label>
                <div className="mt-1">
                  <input type="time" name="endTime" id="endTime" className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700">Duration (hrs)</label>
                <div className="mt-1">
                  <input type="number" step="0.1" name="duration" id="duration" className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="qtyProduced" className="block text-sm font-medium text-gray-700">Quantity Produced</label>
                <div className="mt-1">
                  <input type="number" name="qtyProduced" id="qtyProduced" className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="qtyScrap" className="block text-sm font-medium text-gray-700">Quantity Scrap</label>
                <div className="mt-1">
                  <input type="number" name="qtyScrap" id="qtyScrap" className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="remarks" className="block text-sm font-medium text-gray-700">Remarks</label>
                <div className="mt-1">
                  <textarea id="remarks" name="remarks" rows={3} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-5">
          <div className="flex justify-end gap-3">
            <button type="button" className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Cancel
            </button>
            <button type="button" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <Play className="h-4 w-4 mr-2" /> Start Timer
            </button>
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
              <Save className="h-4 w-4 mr-2" /> Save Record
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function PlaceholderTab({ title }: { title: string }) {
  return (
    <div className="py-12 text-center">
      <Factory className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">This module is under construction.</p>
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
            <Route path="/" element={<Navigate to="record" replace />} />
            <Route path="record" element={<WorkshopRecord />} />
            <Route path="history" element={<PlaceholderTab title="Workshop History" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
