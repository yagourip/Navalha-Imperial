import { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  Search,
  DollarSign,
  TrendingUp,
  Scissors,
  Database,
  ExternalLink
} from 'lucide-react';
import { Barber, Service, Appointment, AppointmentStatus } from '../types/index.ts';
import { formatCurrency, formatFullDate, calculateEndTime } from '../utils/schedule.ts';
import { generateAppointmentCode } from '../data/initialData.ts';

interface AdminDashboardProps {
  barbers: Barber[];
  services: Service[];
  appointments: Appointment[];
  isSupabaseConnected: boolean;
  onUpdateStatus: (id: string, newStatus: AppointmentStatus) => Promise<void>;
  onAddManualAppointment: (appointment: Appointment) => Promise<void>;
  onSyncSupabase: () => Promise<void>;
  isSyncing: boolean;
  onOpenSupabaseModal: () => void;
}

export function AdminDashboard({
  barbers,
  services,
  appointments,
  isSupabaseConnected,
  onUpdateStatus,
  onAddManualAppointment,
  onSyncSupabase,
  isSyncing,
  onOpenSupabaseModal,
}: AdminDashboardProps) {
  // Today's date YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // Filters
  const [dateFilter, setDateFilter] = useState<'today' | 'upcoming' | 'all'>('today');
  const [selectedBarberFilter, setSelectedBarberFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Manual Walk-in Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [manualBarberId, setManualBarberId] = useState<string>(barbers[0]?.id || '');
  const [manualServiceId, setManualServiceId] = useState<string>(services[0]?.id || '');
  const [manualTime, setManualTime] = useState<string>('15:00');
  const [manualCustomerName, setManualCustomerName] = useState<string>('');
  const [manualCustomerPhone, setManualCustomerPhone] = useState<string>('');
  const [manualNotes, setManualNotes] = useState<string>('Encaixe balcão');

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((app) => {
      // Date filter
      if (dateFilter === 'today' && app.date !== todayStr) return false;
      if (dateFilter === 'upcoming' && app.date < todayStr) return false;

      // Barber filter
      if (selectedBarberFilter !== 'all' && app.barberId !== selectedBarberFilter) return false;

      // Status filter
      if (statusFilter !== 'all' && app.status !== statusFilter) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = app.customerName.toLowerCase().includes(q);
        const matchPhone = app.customerPhone.includes(q);
        const matchCode = app.code.toLowerCase().includes(q);
        const matchService = app.serviceName.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchCode && !matchService) return false;
      }

      return true;
    });
  }, [appointments, dateFilter, selectedBarberFilter, statusFilter, searchQuery, todayStr]);

  // Statistics for Today
  const stats = useMemo(() => {
    const todayApps = appointments.filter((a) => a.date === todayStr);
    const scheduled = todayApps.filter((a) => a.status === 'scheduled').length;
    const completed = todayApps.filter((a) => a.status === 'completed').length;
    const cancelled = todayApps.filter((a) => a.status === 'cancelled').length;
    const estimatedRevenue = todayApps
      .filter((a) => a.status !== 'cancelled')
      .reduce((acc, curr) => acc + curr.totalPrice, 0);

    return {
      totalToday: todayApps.length,
      scheduled,
      completed,
      cancelled,
      estimatedRevenue,
    };
  }, [appointments, todayStr]);

  // Handle manual walk-in submit
  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCustomerName.trim() || !manualCustomerPhone.trim()) return;

    const chosenService = services.find((s) => s.id === manualServiceId) || services[0];
    const chosenBarber = barbers.find((b) => b.id === manualBarberId) || barbers[0];
    const endTime = calculateEndTime(manualTime, chosenService.durationMinutes);

    const newApp: Appointment = {
      id: 'app_manual_' + Date.now(),
      code: generateAppointmentCode(),
      barberId: chosenBarber.id,
      barberName: chosenBarber.name,
      serviceId: chosenService.id,
      serviceName: chosenService.name,
      serviceDuration: chosenService.durationMinutes,
      totalPrice: chosenService.price,
      customerName: manualCustomerName.trim(),
      customerPhone: manualCustomerPhone.trim(),
      notes: manualNotes.trim(),
      date: todayStr,
      time: manualTime,
      endTime,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    };

    await onAddManualAppointment(newApp);
    setIsManualModalOpen(false);
    setManualCustomerName('');
    setManualCustomerPhone('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
            <Scissors className="w-3.5 h-3.5" />
            <span>Gestão Operacional</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-display">
            Painel da Barbearia
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Visão em tempo real de agendamentos, profissionais e faturamento estimado.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Subtle sync button */}
          <button
            onClick={onSyncSupabase}
            disabled={isSyncing}
            title={isSupabaseConnected ? "Sincronizar dados com Supabase" : "Conectar ou sincronizar dados"}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
          </button>

          <button
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Encaixe Balcão</span>
          </button>
        </div>
      </div>

      {/* Metric Cards (Zero-pill, high contrast, clean typography) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium mb-2">
            <span>Faturamento Hoje</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">
            {formatCurrency(stats.estimatedRevenue)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            {stats.totalToday} atendimentos previstos
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium mb-2">
            <span>Horários Agendados</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 tabular-nums">
            {stats.scheduled}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Aguardando atendimento</div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium mb-2">
            <span>Concluídos Hoje</span>
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">
            {stats.completed}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Finalizados com sucesso</div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium mb-2">
            <span>Barbeiros Ativos</span>
            <TrendingUp className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">
            {barbers.length}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Profissionais em escala</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex flex-wrap items-center justify-between gap-4">
        {/* Date tabs */}
        <div className="flex items-center gap-1 p-1 bg-neutral-950 border border-neutral-800 rounded-xl">
          <button
            onClick={() => setDateFilter('today')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              dateFilter === 'today'
                ? 'bg-amber-500 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Hoje
          </button>
          <button
            onClick={() => setDateFilter('upcoming')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              dateFilter === 'upcoming'
                ? 'bg-amber-500 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Próximos Dias
          </button>
          <button
            onClick={() => setDateFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              dateFilter === 'all'
                ? 'bg-amber-500 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Todos
          </button>
        </div>

        {/* Barber dropdown & status */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedBarberFilter}
            onChange={(e) => setSelectedBarberFilter(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Todos os Barbeiros</option>
            {barbers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Todos os Status</option>
            <option value="scheduled">Apenas Agendados</option>
            <option value="completed">Apenas Concluídos</option>
            <option value="cancelled">Apenas Cancelados</option>
          </select>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="Buscar cliente, código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 w-44 sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* Appointments List / Table */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl overflow-hidden">
        {filteredAppointments.length === 0 ? (
          <div className="py-16 text-center text-neutral-400">
            <Calendar className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
            <p className="text-sm font-semibold">Nenhum agendamento encontrado para este filtro.</p>
            <p className="text-xs text-neutral-500 mt-1">
              Altere a data ou barbeiro selecionado para visualizar mais horários.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/80">
            {filteredAppointments.map((app) => (
              <div
                key={app.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-900/80 transition-colors"
              >
                {/* Time & Code */}
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col items-center justify-center text-center shrink-0">
                    <span className="text-sm font-bold text-amber-400 tabular-nums">
                      {app.time}
                    </span>
                    <span className="text-[10px] text-neutral-500 tabular-nums">
                      {app.endTime}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                        #{app.code}
                      </span>
                      <h3 className="text-sm font-bold text-white">{app.customerName}</h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400">
                      <span className="text-neutral-200 font-medium">{app.serviceName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1 text-amber-400/90 font-medium">
                        <Scissors className="w-3 h-3" />
                        {app.barberName}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{formatFullDate(app.date)}</span>
                    </div>

                    {app.notes && (
                      <p className="text-[11px] text-neutral-500 mt-1 italic">
                        Obs: "{app.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Right side: Price, Status, Quick Actions */}
                <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-neutral-800/60">
                  <div className="text-left md:text-right mr-2">
                    <div className="text-sm font-bold text-amber-400 tabular-nums">
                      {formatCurrency(app.totalPrice)}
                    </div>
                    <div className="text-[11px] text-neutral-500">{app.serviceDuration} min</div>
                  </div>

                  {/* Status label */}
                  <div>
                    {app.status === 'scheduled' && (
                      <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                        Agendado
                      </span>
                    )}
                    {app.status === 'completed' && (
                      <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
                        Concluído
                      </span>
                    )}
                    {app.status === 'cancelled' && (
                      <span className="text-xs font-semibold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20">
                        Cancelado
                      </span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5">
                    {/* WhatsApp */}
                    {app.customerPhone && (
                      <a
                        href={`https://wa.me/55${app.customerPhone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Chamar no WhatsApp"
                        className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-emerald-500/40 text-neutral-400 hover:text-emerald-400 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {app.status === 'scheduled' && (
                      <>
                        <button
                          onClick={() => onUpdateStatus(app.id, 'completed')}
                          title="Concluir Atendimento"
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Concluir</span>
                        </button>
                        <button
                          onClick={() => onUpdateStatus(app.id, 'cancelled')}
                          title="Cancelar Agendamento"
                          className="px-2 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-red-500/40 text-neutral-400 hover:text-red-400 text-xs transition-colors cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    {app.status === 'cancelled' && (
                      <button
                        onClick={() => onUpdateStatus(app.id, 'scheduled')}
                        className="px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-300 transition-colors cursor-pointer"
                      >
                        Reativar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Walk-in Manual Appointment Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white font-display">Novo Encaixe de Balcão</h3>
            <p className="text-xs text-neutral-400">
              Registre um cliente presente na barbearia para hoje ({formatFullDate(todayStr)}).
            </p>

            <form onSubmit={handleSaveManual} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome do cliente"
                  value={manualCustomerName}
                  onChange={(e) => setManualCustomerName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="(11) 99999-9999"
                    value={manualCustomerPhone}
                    onChange={(e) => setManualCustomerPhone(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Horário Início *
                  </label>
                  <input
                    type="time"
                    required
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Profissional *
                  </label>
                  <select
                    value={manualBarberId}
                    onChange={(e) => setManualBarberId(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {barbers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Serviço *
                  </label>
                  <select
                    value={manualServiceId}
                    onChange={(e) => setManualServiceId(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({formatCurrency(s.price)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Observações
                </label>
                <input
                  type="text"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-medium hover:bg-neutral-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 text-neutral-950 text-xs font-bold hover:bg-amber-400 cursor-pointer"
                >
                  Registrar Encaixe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
