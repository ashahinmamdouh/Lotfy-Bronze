import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Database, 
  ClipboardList, 
  CalendarDays, 
  Factory, 
  CheckSquare, 
  Package, 
  Clock, 
  BarChart3, 
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Master Data', href: '/master-data', icon: Database },
  { name: 'Work Orders', href: '/work-orders', icon: ClipboardList },
  { name: 'Planning', href: '/planning', icon: CalendarDays },
  { name: 'Execution', href: '/workshop', icon: Factory },
  { name: 'Quality Control', href: '/quality', icon: CheckSquare },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Over Time', href: '/overtime', icon: Clock },
  { name: 'Reporting', href: '/reporting', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    navigate('/login');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    const route = navigation.find(n => path.startsWith(n.href) && n.href !== '/');
    return route ? route.name : '';
  };

  return (
    <div className="flex h-screen bg-[#f9f9f6] font-sans text-gray-900">
      {/* Mobile sidebar */}
      <div className={cn("fixed inset-0 z-50 lg:hidden", sidebarOpen ? "block" : "hidden")}>
        <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-72 bg-[#141414] text-white flex flex-col">
          <div className="flex items-center justify-between h-24 px-6 border-b border-gray-800">
            <div>
              <span className="block text-2xl font-serif italic text-[#f27d26]">Lotfy Bronze</span>
              <span className="block text-xs font-semibold tracking-widest text-gray-500 mt-1 uppercase">Foundry Management</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="p-1 text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
                return (
                  <li key={item.name}>
                    <NavLink
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center justify-between px-6 py-3 text-sm font-medium transition-colors",
                        isActive ? "bg-[#f27d26] text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <item.icon className="w-5 h-5" />
                        {item.name}
                      </div>
                      {isActive && <ChevronRight className="w-4 h-4" />}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="p-4 border-t border-gray-800 bg-[#1a1a1a]">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-10 h-10 rounded-full bg-[#f27d26] flex items-center justify-center text-white font-bold">
                A
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">Admin</div>
              </div>
              <button onClick={handleLogout} className="text-gray-400 hover:text-white p-2">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 bg-[#141414] text-white z-20">
        <div className="flex flex-col justify-center h-24 px-8 border-b border-gray-800 shrink-0">
          <span className="block text-2xl font-serif italic text-[#f27d26]">Lotfy Bronze</span>
          <span className="block text-[10px] font-bold tracking-[0.15em] text-gray-500 mt-1 uppercase">Foundry Management</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 custom-scrollbar">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
              return (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    className={cn(
                      "flex items-center justify-between px-8 py-3.5 text-sm font-medium transition-colors",
                      isActive ? "bg-[#f27d26] text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4" />}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-800 bg-[#1a1a1a] shrink-0">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-10 h-10 rounded-full bg-[#f27d26] flex items-center justify-center text-white font-bold">
              A
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-white">Admin</div>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-white p-2 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:pl-72 min-w-0">
        <header className="h-24 bg-white/50 backdrop-blur-sm border-b border-gray-200 flex items-center justify-between px-4 sm:px-8 shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-900"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-serif italic text-gray-900">{getPageTitle()}</h1>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
