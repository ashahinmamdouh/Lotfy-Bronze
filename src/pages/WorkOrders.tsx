import React, { useState } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Plus, Search, Download, Upload, Edit, Trash2, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';

const tabs = [
  { name: 'Open Work Orders', path: 'open' },
  { name: 'Create Work Order', path: 'create' },
  { name: 'Work Order History', path: 'history' },
];

const mockOrders = [
  { id: 'WO-2026-001', material: 'BRZ-01', process: 'Sand Casting', dimensions: 'OD: 120, ID: 80, L: 500', qty: 10, weight: 150.5, stage: 'Furnace Melting', workshop: 'Foundry A', start: '2026-03-10', due: '2026-03-15', priority: 'High', status: 'In Production' },
  { id: 'WO-2026-002', material: 'BRZ-02', process: 'Centrifugal Casting', dimensions: 'OD: 200, ID: 150, L: 1000', qty: 5, weight: 220.0, stage: 'Waiting Material', workshop: 'Foundry B', start: '2026-03-12', due: '2026-03-20', priority: 'Normal', status: 'Planned' },
];

function OpenOrdersList() {
  const handleExport = () => {
    if (mockOrders.length === 0) {
      alert("No data to export");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(mockOrders);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Work Orders");
    XLSX.writeFile(workbook, "work_orders.xlsx");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Search orders..."
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExport}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
                  {mockOrders.map((order) => (
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

function CreateWorkOrder() {
  return (
    <div className="max-w-3xl mx-auto">
      <form className="space-y-8 divide-y divide-gray-200">
        <div className="space-y-8 divide-y divide-gray-200">
          <div>
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Create New Work Order</h3>
              <p className="mt-1 text-sm text-gray-500">
                Enter the details for the new production order. Weight will be calculated automatically based on dimensions and material density.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="product" className="block text-sm font-medium text-gray-700">Product Type</label>
                <div className="mt-1">
                  <select id="product" name="product" className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                    <option>Bars</option>
                    <option>Bushings</option>
                    <option>Plates</option>
                    <option>Impellers</option>
                    <option>Custom</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="material" className="block text-sm font-medium text-gray-700">Material</label>
                <div className="mt-1">
                  <select id="material" name="material" className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                    <option>BRZ-01 (Bronze C93200)</option>
                    <option>BRZ-02 (Aluminum Bronze C95400)</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="od" className="block text-sm font-medium text-gray-700">Outer Diameter (mm)</label>
                <div className="mt-1">
                  <input type="number" name="od" id="od" className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="id" className="block text-sm font-medium text-gray-700">Inner Diameter (mm)</label>
                <div className="mt-1">
                  <input type="number" name="id" id="id" className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="length" className="block text-sm font-medium text-gray-700">Length (mm)</label>
                <div className="mt-1">
                  <input type="number" name="length" id="length" className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="qty" className="block text-sm font-medium text-gray-700">Quantity</label>
                <div className="mt-1">
                  <input type="number" name="qty" id="qty" defaultValue={1} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700">Calculated Weight (kg)</label>
                <div className="mt-1">
                  <input type="text" name="weight" id="weight" disabled readOnly className="bg-gray-50 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
                <div className="mt-1">
                  <select id="priority" name="priority" className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                    <option>Normal</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </div>
              </div>
              
              <div className="sm:col-span-6">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes / Comments</label>
                <div className="mt-1">
                  <textarea id="notes" name="notes" rows={3} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-5">
          <div className="flex justify-end">
            <button type="button" className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Cancel
            </button>
            <button type="submit" className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Save Work Order
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
      <FileText className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">This module is under construction.</p>
    </div>
  );
}

export default function WorkOrders() {
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
            <Route path="/" element={<Navigate to="open" replace />} />
            <Route path="open" element={<OpenOrdersList />} />
            <Route path="create" element={<CreateWorkOrder />} />
            <Route path="history" element={<PlaceholderTab title="Work Order History" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
