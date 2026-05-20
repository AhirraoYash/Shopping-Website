import React, { useEffect, useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { Config } from '../types';
import { Phone, Zap, Info } from 'lucide-react';

export function CustomerLayout() {
  const [config, setConfig] = useState<Config | null>(null);

  useEffect(() => {
    apiService.getConfig().then(setConfig).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col font-sans text-shop-gray">
      <header className="bg-shop-yellow sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-shop-gray w-8 h-8 rounded-full flex items-center justify-center text-white">
              <Zap className="w-4 h-4" fill="currentColor" />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight text-shop-gray">Ashirvad Electrical</h1>
              <p className="text-[10px] text-shop-gray/80 font-bold uppercase tracking-wider">& MOBAIL REPAIRING</p>
            </div>
          </Link>
          <a
            href={config ? `https://wa.me/${config.ownerWhatsAppNumber}` : '#'}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-xs font-bold text-shop-gray bg-white/50 px-3 py-1.5 rounded hover:bg-white/70 transition-colors uppercase tracking-wide"
          >
            <Phone className="w-3 h-3" />
            <span className="hidden sm:inline">Contact</span>
          </a>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Ashirvad Electrical. All rights reserved.</p>
        <div className="mt-2 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
          <p className="flex items-center justify-center gap-1">
            <Info className="w-3 h-3" /> Digital Menu Catalog
          </p>
          <span className="hidden sm:inline text-slate-300">|</span>
          <Link to="/login" className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-shop-gray transition-colors">
            Admin Login
          </Link>
        </div>
      </footer>
    </div>
  );
}
