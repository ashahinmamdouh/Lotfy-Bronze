import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Settings as SettingsIcon, Users, Sliders, Globe, Plus, X } from 'lucide-react';
import { collection, doc, getDoc, setDoc, onSnapshot, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useFirebase } from '../context/FirebaseContext';

const tabs = [
  { name: 'User Management', path: 'users', icon: Users },
  { name: 'General Setting', path: 'general', icon: Globe },
  { name: 'System Setting', path: 'system', icon: Sliders },
];

interface User {
  id: string;
  name: string;
  email: string;
  position: string;
  dept: string;
  role: string;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function UserManagement() {
  const { user: authUser } = useFirebase();
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    position: '',
    dept: '',
    role: 'User'
  });

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: authUser?.uid,
        email: authUser?.email,
        emailVerified: authUser?.emailVerified,
        isAnonymous: authUser?.isAnonymous,
        tenantId: authUser?.tenantId,
        providerInfo: authUser?.providerData.map(provider => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    alert(`Action failed: ${errInfo.error}`);
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(usersData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    return () => unsubscribe();
  }, [authUser]);

  const handleOpenModal = (user?: User) => {
    try {
      if (user) {
        setEditingUser(user);
        setFormData({
          name: user.name || '',
          email: user.email || '',
          position: user.position || '',
          dept: user.dept || '',
          role: user.role || 'User'
        });
      } else {
        setEditingUser(null);
        setFormData({
          name: '',
          email: '',
          position: '',
          dept: '',
          role: 'User'
        });
      }
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error opening modal:', err);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const path = 'users';
    try {
      if (editingUser) {
        await updateDoc(doc(db, path, editingUser.id), formData);
      } else {
        await addDoc(collection(db, path), formData);
      }
      handleCloseModal();
    } catch (error) {
      handleFirestoreError(error, editingUser ? OperationType.UPDATE : OperationType.CREATE, path);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const path = `users/${id}`;
      try {
        await deleteDoc(doc(db, 'users', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">System Users</h3>
        <button 
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#141414] hover:bg-black"
        >
          <Plus className="w-4 h-4 mr-2" />
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
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.position}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.dept}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={cn(
                          "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                          user.role === 'Admin' ? "bg-purple-100 text-purple-800" :
                          user.role === 'Manager' ? "bg-blue-100 text-blue-800" :
                          "bg-green-100 text-green-800"
                        )}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                        <button onClick={() => handleOpenModal(user)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                        <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-900">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleCloseModal}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {editingUser ? 'Edit User' : 'Add New User'}
                  </h3>
                  <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-500">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <form onSubmit={handleSaveUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Position</label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Department</label>
                    <input
                      type="text"
                      value={formData.dept}
                      onChange={(e) => setFormData({ ...formData, dept: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Manager">Manager</option>
                      <option value="User">User</option>
                    </select>
                  </div>
                  <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#141414] text-base font-medium text-white hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GeneralSettings() {
  const [logo, setLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('Lotfy Bronze');
  const [emailAddress, setEmailAddress] = useState('info@lotfybronze.com');
  const { user } = useFirebase();

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.logo) setLogo(data.logo);
        if (data.companyName) setCompanyName(data.companyName);
        if (data.emailAddress) setEmailAddress(data.emailAddress);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for Firestore
        alert('File is too large. Please choose an image under 1MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        setLogo(result);
        try {
          await setDoc(doc(db, 'settings', 'general'), { logo: result }, { merge: true });
        } catch (error) {
          console.error('Error saving logo:', error);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = async () => {
    setLogo(null);
    try {
      await setDoc(doc(db, 'settings', 'general'), { logo: null }, { merge: true });
    } catch (error) {
      console.error('Error removing logo:', error);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'settings', 'general'), {
        companyName,
        emailAddress
      }, { merge: true });
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
        <p className="mt-1 text-sm text-gray-500">Manage your company profile and general preferences.</p>
      </div>

      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 border border-gray-200">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Company Profile</h3>
            <p className="mt-1 text-sm text-gray-500">
              This information will be displayed across the application.
            </p>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            <form className="space-y-6" onSubmit={handleSaveSettings}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Logo</label>
                <div className="mt-1 flex items-center space-x-5">
                  <span className="inline-block h-16 w-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                    {logo ? (
                      <img src={logo} alt="Company Logo" className="h-full w-full object-contain bg-white" />
                    ) : (
                      <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    )}
                  </span>
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="logo-upload"
                      className="bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer text-center"
                    >
                      <span>Upload Logo</span>
                      <input
                        id="logo-upload"
                        name="logo-upload"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleLogoUpload}
                      />
                    </label>
                    {logo && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-red-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">Recommended size: 256x256px. PNG, JPG, GIF up to 1MB.</p>
              </div>

              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="company-name" className="block text-sm font-medium text-gray-700">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="company-name"
                    id="company-name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="email-address" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <input
                    type="email"
                    name="email-address"
                    id="email-address"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#141414] hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                >
                  Save Changes
                </button>
              </div>
            </form>
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
            <Route path="general" element={<GeneralSettings />} />
            <Route path="system" element={<PlaceholderTab title="System Settings" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
