import React from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Settings as SettingsIcon, Users, Sliders, Globe } from 'lucide-react';

const tabs = [
  { name: 'User Management', path: 'users', icon: Users },
  { name: 'General Setting', path: 'general', icon: Globe },
  { name: 'System Setting', path: 'system', icon: Sliders },
];

const mockUsers = [
  { id: 1, name: 'Admin User', email: 'admin@lotfybronze.com', position: 'System Admin', dept: 'IT', role: 'Admin' },
  { id: 2, name: 'Ahmed Hassan', email: 'ahmed@lotfybronze.com', position: 'Production Manager', dept: 'Production', role: 'Manager' },
  { id: 3, name: 'Mohamed Ali', email: 'mohamed@lotfybronze.com', position: 'Quality Inspector', dept: 'Quality', role: 'Inspector' },
];

function UserManagement() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">System Users</h3>
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
          Add User
        </button>
      </div>

      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Edit</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mockUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.position}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.dept}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-indigo-600 hover:text-indigo-900">Edit</button>
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
      <SettingsIcon className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">This module is under construction.</p>
    </div>
  );
}

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage system configuration, users, and permissions.</p>
      </div>

      <div className="bg-white shadow rounded-lg flex flex-col md:flex-row min-h-[500px]">
        <div className="w-full md:w-64 border-r border-gray-200 bg-gray-50 p-4">
          <nav className="space-y-1" aria-label="Sidebar">
            {tabs.map((tab) => (
              <NavLink
                key={tab.name}
                to={`/settings/${tab.path}`}
                className={({ isActive }) =>
                  cn(
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-700'
                      : 'text-gray-900 hover:bg-gray-100 hover:text-gray-900 border-transparent',
                    'group flex items-center px-3 py-2 text-sm font-medium border-l-4'
                  )
                }
              >
                <tab.icon
                  className={cn(
                    'text-gray-400 group-hover:text-gray-500 mr-3 flex-shrink-0 h-5 w-5'
                  )}
                  aria-hidden="true"
                />
                <span className="truncate">{tab.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex-1 p-6">
          <Routes>
            <Route path="/" element={<Navigate to="users" replace />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="general" element={<PlaceholderTab title="General Settings" />} />
            <Route path="system" element={<PlaceholderTab title="System Settings" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
