import { useState, useMemo, useEffect } from 'react';
import { X, Search, Phone, Calendar, Clock, AlertTriangle, CheckCircle2, XCircle, User } from 'lucide-react';
import { Appointment, AppUser } from '../types/index.ts';
import { formatCurrency, formatFullDate, createWhatsAppConfirmationLink } from '../utils/schedule.ts';

interface CustomerAppointmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: Appointment[];
  currentUser?: AppUser | null;
  onCancelAppointment: (id: string) => Promise<void>;
}

export function CustomerAppointmentsModal({
  isOpen,
  onClose,
  appointments,
  currentUser,
  onCancelAppointment,
}: CustomerAppointmentsModalProps) {
  const [searchPhone, setSearchPhone] = useState<string>('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Set default search to user phone or email when modal opens
  useEffect(() => {
    if (isOpen && currentUser) {
      if (currentUser.phone) {
        setSearchPhone(currentUser.phone);
      } else if (currentUser.email) {
        setSearchPhone(currentUser.email);
      }
    }
  }, [isOpen, currentUser]);

  // Normalize search string
  const cleanSearch = searchPhone.replace(/\D/g, '');

  const filteredAppointments = useMemo(() => {
    if (!searchPhone.trim()) {
      // If user is logged in, show their appointments first
      if (currentUser) {
        const userPhoneDigits = (currentUser.phone || '').replace(/\D/g, '');
        const userEmail = (currentUser.email || '').toLowerCase();
        const userApps = appointments.filter((app) => {
          const appPhoneClean = app.customerPhone.replace(/\D/g, '');
          const appEmail = (app.customerEmail || '').toLowerCase();
          return (
            (userPhoneDigits && appPhoneClean.includes(userPhoneDigits)) ||
            (userEmail && appEmail === userEmail)
          );
        });
        if (userApps.length > 0) return userApps;
      }
      // If no search, show the 5 most recent appointments as convenience
      return appointments.slice(0, 5);
    }
    return appointments.filter((app) => {
      const appPhoneClean = app.customerPhone.replace(/\D/g, '');
      const codeClean = app.code.toLowerCase();
      const nameClean = app.customerName.toLowerCase();
      const emailClean = (app.customerEmail || '').toLowerCase();
      const q = searchPhone.toLowerCase().trim();
      return (
        (cleanSearch && appPhoneClean.includes(cleanSearch)) ||
        codeClean.includes(q) ||
        nameClean.includes(q) ||
        emailClean.includes(q)
      );
    });
  }, [appointments, cleanSearch, searchPhone, currentUser]);

  if (!isOpen) return null;

  const handleCancel = async (id: string) => {
    if (window.confirm('Tem certeza que deseja cancelar este agendamento?')) {
      setCancellingId(id);
      await onCancelAppointment(id);
      setCancellingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white font-display">Meus Agendamentos</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Search Box */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              Buscar por Telefone / WhatsApp ou Código da Reserva
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Digite seu número (ex: 11 99999-9999) ou código (#IMP-XXXX)"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          {/* List */}
          <div className="space-y-3">
            {filteredAppointments.length === 0 ? (
              <div className="py-12 text-center text-neutral-400">
                <AlertTriangle className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Nenhum agendamento encontrado.</p>
                <p className="text-xs text-neutral-500 mt-1">
                  Verifique o telefone informado ou realize um novo agendamento.
                </p>
              </div>
            ) : (
              filteredAppointments.map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 hover:border-neutral-700 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          #{app.code}
                        </span>
                        <h4 className="text-sm font-bold text-white">{app.serviceName}</h4>
                      </div>
                      <p className="text-xs text-neutral-400">
                        Profissional: <span className="text-neutral-200">{app.barberName}</span> ·
                        Cliente: <span className="text-neutral-200">{app.customerName}</span>
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0 text-right">
                      {app.status === 'scheduled' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Confirmado
                        </span>
                      )}
                      {app.status === 'completed' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                          Concluído
                        </span>
                      )}
                      {app.status === 'cancelled' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                          <XCircle className="w-3 h-3" />
                          Cancelado
                        </span>
                      )}
                      <div className="text-xs font-bold text-amber-400 tabular-nums mt-1">
                        {formatCurrency(app.totalPrice)}
                      </div>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-neutral-400 pt-2 border-t border-neutral-900">
                    <span className="flex items-center gap-1.5 text-neutral-300">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      {formatFullDate(app.date)}
                    </span>
                    <span className="flex items-center gap-1.5 text-neutral-300">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      {app.time} às {app.endTime} ({app.serviceDuration} min)
                    </span>
                  </div>

                  {/* Actions */}
                  {app.status === 'scheduled' && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-900">
                      <a
                        href={createWhatsAppConfirmationLink(app)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 py-1 px-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 transition-colors"
                      >
                        <Phone className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>
                      <button
                        onClick={() => handleCancel(app.id)}
                        disabled={cancellingId === app.id}
                        className="text-xs text-red-400 hover:text-red-300 py-1 px-2.5 rounded bg-red-500/10 border border-red-500/20 transition-colors cursor-pointer"
                      >
                        {cancellingId === app.id ? 'Cancelando...' : 'Cancelar Horário'}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-neutral-950 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
