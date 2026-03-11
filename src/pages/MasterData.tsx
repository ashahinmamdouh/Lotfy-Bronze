import React, { useState } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Plus, Search, Download, Upload, Edit, Trash2, Database } from 'lucide-react';

const tabs = [
  { name: 'MATERIALS', path: 'materials' },
  { name: 'FG PRODUCTS', path: 'products' },
  { name: 'MANUFACTURING PROCESSES', path: 'processes' },
  { name: 'MOLDS', path: 'molds' },
  { name: 'WORKSHOPS', path: 'workshops' },
  { name: 'OPERATORS', path: 'operators' },
  { name: 'REJECTION REASONS', path: 'rejections' },
];

const mockMaterials = [
  { id: 'M001', code: 'BRZ-01', name: 'Bronze C93200', family: 'Bronze', density: 8.93, alloy: 'Cu 83%, Sn 7%, Pb 7%, Zn 3%', scrapRatio: 5, process: 'Sand Casting', status: 'Active' },
  { id: 'M002', code: 'BRZ-02', name: 'Aluminum Bronze C95400', family: 'Bronze', density: 7.45, alloy: 'Cu 85%, Al 11%, Fe 4%', scrapRatio: 4, process: 'Centrifugal Casting', status: 'Active' },
];

function MaterialsList() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-none leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm"
            placeholder="Search Materials..."
          />
        </div>
        <div className="flex gap-3">
          <button className="inline-flex items-center px-4 py-2.5 border border-gray-300 text-sm font-bold tracking-wider uppercase text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </button>
          <button className="inline-flex items-center px-4 py-2.5 border border-gray-300 text-sm font-bold tracking-wider uppercase text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="bg-white border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">Code</th>
                    <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">Name</th>
                    <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">Family</th>
                    <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">Density</th>
                    <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                    <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {mockMaterials.map((material) => (
                    <tr key={material.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-900">{material.code}</td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-900">{material.name}</td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-900">{material.family}</td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-900">{material.density} g/cm³</td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-900">
                        {material.status}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-3">
                          <button className="text-gray-400 hover:text-black transition-colors"><Edit className="h-4 w-4" /></button>
                          <button className="text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
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

function PlaceholderTab({ title }: { title: string }) {
  return (
    <div className="py-12 text-center">
      <Database className="mx-auto h-12 w-12 text-gray-300" />
      <h3 className="mt-4 text-sm font-medium text-gray-900 uppercase tracking-widest">{title}</h3>
      <p className="mt-2 text-sm text-gray-500">This module is under construction.</p>
    </div>
  );
}

export default function MasterData() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <nav className="flex flex-wrap gap-2 border-b border-gray-200 pb-4" aria-label="Tabs">
          {tabs.map((tab) => (
            <NavLink
              key={tab.name}
              to={tab.path}
              className={({ isActive }) =>
                cn(
                  isActive
                    ? 'bg-[#141414] text-white'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100',
                  'px-4 py-2.5 text-[11px] font-bold tracking-widest uppercase transition-colors'
                )
              }
            >
              {tab.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="pt-2">
        <Routes>
          <Route path="/" element={<Navigate to="materials" replace />} />
          <Route path="materials" element={<MaterialsList />} />
          <Route path="products" element={<PlaceholderTab title="Products" />} />
          <Route path="processes" element={<PlaceholderTab title="Manufacturing Process" />} />
          <Route path="molds" element={<PlaceholderTab title="Molds" />} />
          <Route path="workshops" element={<PlaceholderTab title="Workshops" />} />
          <Route path="operators" element={<PlaceholderTab title="Operators" />} />
          <Route path="rejections" element={<PlaceholderTab title="Rejection Reasons" />} />
        </Routes>
      </div>
    </div>
  );
}
