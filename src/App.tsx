import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { BookingWizard } from './components/BookingWizard.tsx';
import { BarbersShowcase } from './components/BarbersShowcase.tsx';
import { ServicesMenu } from './components/ServicesMenu.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { CustomerAppointmentsModal } from './components/CustomerAppointmentsModal.tsx';
import { SupabaseModal } from './components/SupabaseModal.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { Footer } from './components/Footer.tsx';
import { INITIAL_BARBERS, INITIAL_SERVICES } from './data/initialData.ts';
import { Appointment, AppointmentStatus, SupabaseConfig, AppUser } from './types/index.ts';
import {
  fetchAppointments,
  createAppointment,
  updateAppointmentStatus,
  syncLocalToSupabase,
  subscribeToAppointments,
} from './services/storage.ts';
import { getStoredSupabaseConfig } from './lib/supabase.ts';
import { getCurrentUser, signOut, subscribeToAuth } from './services/auth.ts';
import { CheckCircle2, AlertCircle, Database } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'booking' | 'admin' | 'barbers' | 'services'>('booking');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getStoredSupabaseConfig());
  const [currentUser, setCurrentUser] = useState<AppUser | null>(getCurrentUser());
  const [preSelectedBarberId, setPreSelectedBarberId] = useState<string | null>(null);

  // Modals
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);
  const [isMyBookingsModalOpen, setIsMyBookingsModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // In-app toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Listen to auth changes
  useEffect(() => {
    const unsub = subscribeToAuth((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  // Load appointments
  const loadAppointmentsData = useCallback(async () => {
    const res = await fetchAppointments();
    setAppointments(res.data);
    if (res.error && supabaseConfig.isConnected) {
      console.warn('Notice:', res.error);
    }
  }, [supabaseConfig.isConnected]);

  useEffect(() => {
    loadAppointmentsData();

    // Subscribe to realtime updates
    const unsubscribe = subscribeToAppointments(() => {
      loadAppointmentsData();
    });

    return () => {
      unsubscribe();
    };
  }, [loadAppointmentsData]);

  // Handle new appointment from wizard
  const handleBookAppointment = async (appointment: Appointment): Promise<{
    success: boolean;
    savedToSupabase: boolean;
  }> => {
    const result = await createAppointment(appointment);
    await loadAppointmentsData();

    if (result.savedToSupabase) {
      showToast('Agendamento registrado com sucesso no Supabase!');
    } else {
      showToast('Agendamento registrado com sucesso!');
    }

    return { success: result.success, savedToSupabase: result.savedToSupabase };
  };

  // Handle status update from Admin or Customer
  const handleUpdateStatus = async (id: string, newStatus: AppointmentStatus) => {
    await updateAppointmentStatus(id, newStatus);
    await loadAppointmentsData();
    showToast(`Status atualizado para: ${newStatus === 'completed' ? 'Concluído' : newStatus === 'cancelled' ? 'Cancelado' : 'Agendado'}`);
  };

  // Handle manual appointment from Admin
  const handleAddManualAppointment = async (appointment: Appointment) => {
    await createAppointment(appointment);
    await loadAppointmentsData();
    showToast('Encaixe de balcão registrado com sucesso!');
  };

  // Handle manual sync to Supabase
  const handleSyncSupabase = async () => {
    setIsSyncing(true);
    const res = await syncLocalToSupabase();
    setIsSyncing(false);
    if (res.error) {
      showToast(`Falha na sincronização: ${res.error}`, 'error');
    } else {
      showToast(`${res.synced} agendamentos sincronizados com o Supabase com sucesso!`);
      await loadAppointmentsData();
    }
  };

  // Refresh config when modal saves
  const handleConfigUpdated = () => {
    const fresh = getStoredSupabaseConfig();
    setSupabaseConfig(fresh);
    loadAppointmentsData();
    showToast('Configurações do Supabase atualizadas!');
  };

  // Auth actions
  const handleSignOut = async () => {
    await signOut();
    setCurrentUser(null);
    showToast('Você saiu da sua conta.');
    if (currentView === 'admin') {
      setCurrentView('booking');
    }
  };

  const handleOpenAuthModal = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (user: AppUser) => {
    setCurrentUser(user);
    showToast(`Olá, ${user.name.split(' ')[0]}! Acesso concedido.`);
    // If user is a barber/admin, offer to switch to management panel
    if (user.role === 'barber' || user.role === 'admin') {
      setCurrentView('admin');
    }
  };

  // Flow from Barbers Showcase into Booking Wizard
  const handleSelectBarberToBook = (barberId: string) => {
    setPreSelectedBarberId(barberId);
    setCurrentView('booking');
    // Scroll to booking wizard
    const el = document.getElementById('agendar');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Flow from Services Menu into Booking Wizard
  const handleSelectServiceToBook = (_serviceId: string) => {
    setCurrentView('booking');
    const el = document.getElementById('agendar');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // If user is not authenticated, show the Login Gate Page first
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-amber-500 selection:text-neutral-950">
        {/* Toast Notification */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
            <div
              className={`px-4 py-3 rounded-xl border shadow-xl flex items-center gap-2.5 text-xs font-semibold ${
                toast.type === 'success'
                  ? 'bg-neutral-900 border-emerald-500/40 text-emerald-300'
                  : 'bg-neutral-900 border-red-500/40 text-red-300'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
          </div>
        )}

        <LoginPage
          onLoginSuccess={handleAuthSuccess}
          isSupabaseConnected={supabaseConfig.isConnected}
          onOpenSupabaseConfig={() => setIsSupabaseModalOpen(true)}
        />

        {/* Supabase Settings & SQL Schema Modal */}
        <SupabaseModal
          isOpen={isSupabaseModalOpen}
          onClose={() => setIsSupabaseModalOpen(false)}
          config={supabaseConfig}
          onConfigUpdated={handleConfigUpdated}
          onSyncNow={handleSyncSupabase}
          isSyncing={isSyncing}
        />

        {/* Discreet Small Corner Supabase Icon */}
        <button
          type="button"
          onClick={() => setIsSupabaseModalOpen(true)}
          title={supabaseConfig.isConnected ? 'Supabase Conectado' : 'Configurar Armazenamento Supabase'}
          className="fixed bottom-3 left-3 z-30 w-7 h-7 rounded-full bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-500 hover:text-amber-400 flex items-center justify-center transition-all cursor-pointer opacity-30 hover:opacity-100 shadow-md backdrop-blur-sm group"
          aria-label="Configurações do Supabase"
        >
          <span
            className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${
              supabaseConfig.isConnected ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          <Database className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500 selection:text-neutral-950">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div
            className={`px-4 py-3 rounded-xl border shadow-xl flex items-center gap-2.5 text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-neutral-900 border-emerald-500/40 text-emerald-300'
                : 'bg-neutral-900 border-red-500/40 text-red-300'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        supabaseConfig={supabaseConfig}
        currentUser={currentUser}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onOpenMyBookingsModal={() => setIsMyBookingsModalOpen(true)}
        onOpenAuthModal={handleOpenAuthModal}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'booking' && (
          <>
            <HeroSection
              onStartBooking={() => {
                const el = document.getElementById('agendar');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onExploreBarbers={() => setCurrentView('barbers')}
            />

            <BookingWizard
              services={INITIAL_SERVICES}
              barbers={INITIAL_BARBERS}
              appointments={appointments}
              isSupabaseConnected={supabaseConfig.isConnected}
              currentUser={currentUser}
              onOpenAuthModal={() => handleOpenAuthModal('signin')}
              onBookAppointment={handleBookAppointment}
              preSelectedBarberId={preSelectedBarberId}
              onClearPreSelectedBarber={() => setPreSelectedBarberId(null)}
            />

            <BarbersShowcase
              barbers={INITIAL_BARBERS}
              onSelectBarberToBook={handleSelectBarberToBook}
            />

            <ServicesMenu
              services={INITIAL_SERVICES}
              onSelectServiceToBook={handleSelectServiceToBook}
            />
          </>
        )}

        {currentView === 'admin' && (
          <AdminDashboard
            barbers={INITIAL_BARBERS}
            services={INITIAL_SERVICES}
            appointments={appointments}
            isSupabaseConnected={supabaseConfig.isConnected}
            onUpdateStatus={handleUpdateStatus}
            onAddManualAppointment={handleAddManualAppointment}
            onSyncSupabase={handleSyncSupabase}
            isSyncing={isSyncing}
            onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          />
        )}

        {currentView === 'barbers' && (
          <div className="py-8">
            <BarbersShowcase
              barbers={INITIAL_BARBERS}
              onSelectBarberToBook={handleSelectBarberToBook}
            />
          </div>
        )}

        {currentView === 'services' && (
          <div className="py-8">
            <ServicesMenu
              services={INITIAL_SERVICES}
              onSelectServiceToBook={handleSelectServiceToBook}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)} />

      {/* Customer Bookings Search Modal */}
      <CustomerAppointmentsModal
        isOpen={isMyBookingsModalOpen}
        onClose={() => setIsMyBookingsModalOpen(false)}
        appointments={appointments}
        currentUser={currentUser}
        onCancelAppointment={async (id) => {
          await handleUpdateStatus(id, 'cancelled');
        }}
      />

      {/* Supabase Settings & SQL Schema Modal */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        config={supabaseConfig}
        onConfigUpdated={handleConfigUpdated}
        onSyncNow={handleSyncSupabase}
        isSyncing={isSyncing}
      />

      {/* Login & Registration Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        isSupabaseConnected={supabaseConfig.isConnected}
        initialMode={authModalMode}
      />

      {/* Discreet Small Corner Supabase Icon */}
      <button
        type="button"
        onClick={() => setIsSupabaseModalOpen(true)}
        title={supabaseConfig.isConnected ? 'Supabase Conectado' : 'Configurar Armazenamento Supabase'}
        className="fixed bottom-3 left-3 z-30 w-7 h-7 rounded-full bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-500 hover:text-amber-400 flex items-center justify-center transition-all cursor-pointer opacity-30 hover:opacity-100 shadow-md backdrop-blur-sm group"
        aria-label="Configurações do Supabase"
      >
        <span
          className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${
            supabaseConfig.isConnected ? 'bg-emerald-400' : 'bg-amber-400'
          }`}
        />
        <Database className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

