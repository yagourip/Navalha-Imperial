import { useState, useRef, useEffect } from 'react';
import {
  Scissors,
  Database,
  LayoutDashboard,
  Calendar,
  LogIn,
  LogOut,
  User,
  ChevronDown,
  CheckCircle2,
  Briefcase
} from 'lucide-react';
import { SupabaseConfig, AppUser } from '../types/index.ts';

interface HeaderProps {
  currentView: 'booking' | 'admin' | 'barbers' | 'services';
  setCurrentView: (view: 'booking' | 'admin' | 'barbers' | 'services') => void;
  supabaseConfig: SupabaseConfig;
  currentUser: AppUser | null;
  onOpenSupabaseModal: () => void;
  onOpenMyBookingsModal: () => void;
  onOpenAuthModal: (mode?: 'signin' | 'signup') => void;
  onSignOut: () => void;
}

export function Header({
  currentView,
  setCurrentView,
  supabaseConfig,
  currentUser,
  onOpenSupabaseModal,
  onOpenMyBookingsModal,
  onOpenAuthModal,
  onSignOut,
}: HeaderProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isStaff = currentUser?.role === 'barber' || currentUser?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 w-full bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single wordmark brand */}
        <button
          onClick={() => setCurrentView('booking')}
          className="flex items-center gap-2.5 text-left group cursor-pointer focus-visible:outline-none"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/20 group-hover:border-amber-500/50 transition-all">
            <Scissors className="w-5 h-5 -rotate-45" />
          </div>
          <div>
            <span className="font-brand text-lg font-bold tracking-widest text-neutral-100 group-hover:text-amber-400 transition-colors">
              NAVALHA IMPERIAL
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => setCurrentView('booking')}
            className={`transition-colors cursor-pointer ${
              currentView === 'booking'
                ? 'text-amber-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Agendar Horário
          </button>
          <button
            onClick={() => setCurrentView('barbers')}
            className={`transition-colors cursor-pointer ${
              currentView === 'barbers'
                ? 'text-amber-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Barbeiros
          </button>
          <button
            onClick={() => setCurrentView('services')}
            className={`transition-colors cursor-pointer ${
              currentView === 'services'
                ? 'text-amber-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Tabela de Serviços
          </button>
          <button
            onClick={onOpenMyBookingsModal}
            className="text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
          >
            Meus Agendamentos
          </button>
        </nav>

        {/* Zone 3: Actions (Admin toggle, User Auth) */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Admin / Booking toggle */}
          {currentView === 'admin' ? (
            <button
              onClick={() => setCurrentView('booking')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-colors cursor-pointer whitespace-nowrap shadow-sm shadow-amber-500/20"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Modo Agendamento</span>
            </button>
          ) : isStaff ? (
            <button
              onClick={() => setCurrentView('admin')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 border border-neutral-700 text-neutral-200 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Painel</span>
            </button>
          ) : null}

          {/* User Auth Section */}
          {currentUser ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-200 text-xs font-semibold transition-all cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[11px] border border-amber-500/30">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[90px] sm:max-w-[120px] truncate text-left">
                  {currentUser.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3 h-3 text-neutral-400" />
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2.5 border-b border-neutral-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white truncate">
                        {currentUser.name}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        {currentUser.role === 'customer'
                          ? 'Cliente'
                          : currentUser.role === 'barber'
                          ? 'Barbeiro'
                          : 'Admin'}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-400 truncate">
                      {currentUser.email}
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        onOpenMyBookingsModal();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center gap-2 cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>Meus Agendamentos</span>
                    </button>

                    {isStaff && (
                      <button
                        onClick={() => {
                          setCurrentView('admin');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center gap-2 cursor-pointer"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
                        <span>Painel da Barbearia</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        onOpenSupabaseModal();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center gap-2 cursor-pointer"
                    >
                      <Database className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Configurações do Supabase</span>
                    </button>
                  </div>

                  <div className="pt-1 border-t border-neutral-800">
                    <button
                      onClick={() => {
                        onSignOut();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sair da Conta</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => onOpenAuthModal('signin')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs tracking-wide transition-all shadow-sm shadow-amber-500/10 cursor-pointer whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
