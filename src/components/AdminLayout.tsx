import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../services/api';
import { Settings, LogOut, Package, FolderTree } from 'lucide-react';
import { toast } from 'sonner';

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    apiService.logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const navItems = [
    { name: 'Products', path: '/admin', icon: Package },
    { name: 'Categories', path: '/admin/categories', icon: FolderTree },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col font-sans">
      <header className="border-b border-slate-200 bg-white pb-4 pt-6 px-4 shrink-0 shadow-sm sticky top-0 z-10 hidden sm:block">
        <div className="max-w-5xl mx-auto flex items-end justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-shop-gray">Ashirvad Electrical <span className="text-amber-500 text-lg uppercase tracking-tighter hidden sm:inline">Shop Dashboard</span></h1>
            <p className="text-slate-500 text-sm italic">Digital Inventory Management System</p>
          </div>
          <button
            onClick={handleLogout}
            className="h-10 px-4 bg-shop-gray text-white rounded-lg flex items-center text-xs font-bold transition-colors hover:bg-gray-800"
          >
            LOGOUT
          </button>
        </div>
      </header>
      
      {/* Mobile header fallback */}
      <header className="sm:hidden bg-shop-gray text-white sticky top-0 z-10 border-b border-gray-800">
        <div className="px-4 h-16 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">Ashirvad Admin</h1>
            <p className="text-xs text-gray-400">Shop Dashboard</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-300 hover:text-white"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>
      
      <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-6 p-4 sm:p-6">
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors shrink-0 text-sm font-semibold ${
                    isActive
                      ? 'bg-slate-100 border-l-4 border-shop-yellow text-shop-gray'
                      : 'bg-white text-slate-500 hover:bg-slate-50 border-l-4 border-transparent'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-shop-yellow drop-shadow-sm' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>
        
        <main className="flex-1 bg-white rounded-[16px] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] border border-slate-100 p-4 sm:p-6 min-h-[500px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
