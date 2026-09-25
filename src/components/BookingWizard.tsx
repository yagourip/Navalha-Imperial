import { useState, useMemo } from 'react';
import {
  Check,
  Clock,
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  User,
  Star,
  Sparkles,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  ExternalLink,
  RotateCcw,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Barber, Service, Appointment, ServiceCategory, AppUser } from '../types/index.ts';
import {
  formatCurrency,
  getAvailableSlots,
  getNextDays,
  formatFullDate,
  calculateEndTime,
  createWhatsAppConfirmationLink,
  createGoogleCalendarLink,
} from '../utils/schedule.ts';
import { generateAppointmentCode } from '../data/initialData.ts';

interface BookingWizardProps {
  services: Service[];
  barbers: Barber[];
  appointments: Appointment[];
  isSupabaseConnected: boolean;
  currentUser?: AppUser | null;
  onOpenAuthModal?: () => void;
  onBookAppointment: (appointment: Appointment) => Promise<{ success: boolean; savedToSupabase: boolean }>;
  preSelectedBarberId?: string | null;
  onClearPreSelectedBarber?: () => void;
}

export function BookingWizard({
  services,
  barbers,
  appointments,
  isSupabaseConnected,
  currentUser,
  onOpenAuthModal,
  onBookAppointment,
  preSelectedBarberId,
  onClearPreSelectedBarber,
}: BookingWizardProps) {
  // Step tracker: 1 = Service, 2 = Barber, 3 = Date & Time, 4 = Customer Data, 5 = Confirmation
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form selections
  const [selectedServiceId, setSelectedServiceId] = useState<string>('srv-combo-imperial');
  const [selectedBarberId, setSelectedBarberId] = useState<string>(preSelectedBarberId || 'any');

  // Days list (next 14 days)
  const availableDays = useMemo(() => getNextDays(14), []);
  const [selectedDate, setSelectedDate] = useState<string>(availableDays[0].dateStr);
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Customer info (prefilled if user is logged in)
  const [customerName, setCustomerName] = useState<string>(currentUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState<string>(currentUser?.phone || '');
  const [customerEmail, setCustomerEmail] = useState<string>(currentUser?.email || '');
  const [customerNotes, setCustomerNotes] = useState<string>('');

  // Sync customer info when currentUser changes
  useState(() => {
    if (currentUser) {
      if (!customerName) setCustomerName(currentUser.name);
      if (!customerPhone && currentUser.phone) setCustomerPhone(currentUser.phone);
      if (!customerEmail) setCustomerEmail(currentUser.email);
    }
  });

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Service filter category
  const [categoryFilter, setCategoryFilter] = useState<'all' | ServiceCategory>('all');

  const selectedService = useMemo(
    () => services.find((s) => s.id === selectedServiceId) || services[0],
    [services, selectedServiceId]
  );

  // Resolve effective barber (if 'any' is selected, find the first barber that works on that date)
  const effectiveBarber = useMemo(() => {
    if (selectedBarberId === 'any') {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dayOfWeek = new Date(y, m - 1, d).getDay();
      const working = barbers.find((b) => b.workingDays.includes(dayOfWeek));
      return working || barbers[0];
    }
    return barbers.find((b) => b.id === selectedBarberId) || barbers[0];
  }, [barbers, selectedBarberId, selectedDate]);

  // Calculate available slots for effective barber
  const timeSlots = useMemo(() => {
    if (!effectiveBarber || !selectedService) return [];
    return getAvailableSlots(effectiveBarber, selectedService.durationMinutes, selectedDate, appointments);
  }, [effectiveBarber, selectedService, selectedDate, appointments]);

  // Group slots by period
  const slotsGrouped = useMemo(() => {
    const morning = timeSlots.filter((s) => {
      const h = parseInt(s.time.split(':')[0], 10);
      return h < 12;
    });
    const afternoon = timeSlots.filter((s) => {
      const h = parseInt(s.time.split(':')[0], 10);
      return h >= 12 && h < 18;
    });
    const evening = timeSlots.filter((s) => {
      const h = parseInt(s.time.split(':')[0], 10);
      return h >= 18;
    });
    return { morning, afternoon, evening };
  }, [timeSlots]);

  // Filtered services
  const filteredServices = useMemo(() => {
    if (categoryFilter === 'all') return services;
    return services.filter((s) => s.category === categoryFilter);
  }, [services, categoryFilter]);

  // Handle phone format mask
  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) {
      setCustomerPhone(digits);
    } else if (digits.length <= 7) {
      setCustomerPhone(`(${digits.slice(0, 2)}) ${digits.slice(2)}`);
    } else {
      setCustomerPhone(`(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`);
    }
  };

  // Submit appointment
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage('Por favor, informe seu nome e número de telefone para contato.');
      return;
    }

    if (!selectedTime) {
      setErrorMessage('Por favor, selecione um horário válido.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const endTime = calculateEndTime(selectedTime, selectedService.durationMinutes);
    const code = generateAppointmentCode();

    const newAppointment: Appointment = {
      id: 'app_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      code,
      barberId: effectiveBarber.id,
      barberName: effectiveBarber.name,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      serviceDuration: selectedService.durationMinutes,
      totalPrice: selectedService.price,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || undefined,
      notes: customerNotes.trim() || undefined,
      date: selectedDate,
      time: selectedTime,
      endTime,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    };

    try {
      await onBookAppointment(newAppointment);
      setConfirmedAppointment(newAppointment);
      setCurrentStep(5);
      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#fbbf24', '#d97706', '#ffffff'],
        });
      } catch {
        // ignore if canvas not supported
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao agendar. Tente novamente.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetBooking = () => {
    setCurrentStep(1);
    setSelectedTime('');
    setConfirmedAppointment(null);
    setErrorMessage(null);
    if (onClearPreSelectedBarber) {
      onClearPreSelectedBarber();
    }
  };

  return (
    <div id="agendar" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 scroll-mt-20">
      {/* Steps Progress Header */}
      {currentStep < 5 && (
        <div className="mb-10">
          <div className="flex items-center justify-between max-w-2xl mx-auto mb-4">
            {[
              { num: 1, label: 'Serviço' },
              { num: 2, label: 'Profissional' },
              { num: 3, label: 'Data & Hora' },
              { num: 4, label: 'Seus Dados' },
            ].map((step, idx) => (
              <div key={step.num} className="flex items-center">
                <button
                  type="button"
                  onClick={() => step.num < currentStep && setCurrentStep(step.num)}
                  disabled={step.num > currentStep}
                  className={`flex items-center gap-2 text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    currentStep === step.num
                      ? 'text-amber-400'
                      : currentStep > step.num
                      ? 'text-neutral-300 hover:text-white'
                      : 'text-neutral-600 cursor-not-allowed'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors ${
                      currentStep === step.num
                        ? 'bg-amber-500 text-neutral-950 font-bold ring-4 ring-amber-500/20'
                        : currentStep > step.num
                        ? 'bg-neutral-800 text-amber-400 border border-amber-500/40'
                        : 'bg-neutral-900 text-neutral-600 border border-neutral-800'
                    }`}
                  >
                    {currentStep > step.num ? <Check className="w-3.5 h-3.5" /> : step.num}
                  </span>
                  <span className="hidden sm:inline">{step.label}</span>
                </button>
                {idx < 3 && (
                  <div
                    className={`w-8 sm:w-16 h-px mx-2 transition-colors ${
                      currentStep > step.num ? 'bg-amber-500/50' : 'bg-neutral-800'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 1: CHOOSE SERVICE */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-display mb-2">
              1. Selecione o Serviço Desejado
            </h2>
            <p className="text-sm text-neutral-400">
              Escolha a experiência de cuidado que você deseja hoje. Você poderá combinar e escolher o barbeiro em seguida.
            </p>
          </div>

          {/* Category Tabs (Segmented control) */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 bg-neutral-900 border border-neutral-800 rounded-xl max-w-md mx-auto">
            {(
              [
                { id: 'all', label: 'Todos' },
                { id: 'cabelo', label: 'Cabelo' },
                { id: 'barba', label: 'Barba' },
                { id: 'combos', label: 'Combos' },
                { id: 'especial', label: 'Especiais' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  categoryFilter === cat.id
                    ? 'bg-amber-500 text-neutral-950 font-semibold shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredServices.map((service) => {
              const isSelected = selectedServiceId === service.id;
              return (
                <div
                  key={service.id}
                  onClick={() => setSelectedServiceId(service.id)}
                  className={`relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-neutral-900 border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
                      : 'bg-neutral-900/60 border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-900/90'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                          {service.name}
                        </h3>
                        {service.popular && (
                          <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Popular
                          </span>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-lg font-bold text-amber-400 tabular-nums">
                          {formatCurrency(service.price)}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                      {service.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-neutral-800/60 text-xs text-neutral-400">
                    <span className="flex items-center gap-1.5 text-neutral-300">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      Duração: {service.durationMinutes} minutos
                    </span>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-amber-500 border-amber-500 text-neutral-950'
                          : 'border-neutral-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm tracking-wide transition-all shadow-md shadow-amber-500/10 cursor-pointer"
            >
              <span>Avançar para Barbeiro</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: CHOOSE BARBER */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-display mb-2">
              2. Escolha o Profissional
            </h2>
            <p className="text-sm text-neutral-400">
              Serviço selecionado:{' '}
              <span className="text-amber-400 font-semibold">{selectedService.name}</span> (
              {selectedService.durationMinutes} min · {formatCurrency(selectedService.price)})
            </p>
          </div>

          {/* Any Barber Option */}
          <div
            onClick={() => setSelectedBarberId('any')}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedBarberId === 'any'
                ? 'bg-neutral-900 border-amber-500 shadow-md shadow-amber-500/10'
                : 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Qualquer Barbeiro Disponível</h4>
                <p className="text-xs text-neutral-400">
                  Ideal se você precisa do primeiro horário livre sem preferência específica.
                </p>
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                selectedBarberId === 'any'
                  ? 'bg-amber-500 border-amber-500 text-neutral-950'
                  : 'border-neutral-700'
              }`}
            >
              {selectedBarberId === 'any' && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </div>

          {/* Specific Barbers List */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {barbers.map((barber) => {
              const isSelected = selectedBarberId === barber.id;
              return (
                <div
                  key={barber.id}
                  onClick={() => setSelectedBarberId(barber.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-neutral-900 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
                      : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/90'
                  }`}
                >
                  <div>
                    {/* Barber photo with graceful fallback */}
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-4 bg-neutral-800 border border-neutral-800">
                      <img
                        src={barber.photoUrl}
                        alt={`Foto do barbeiro ${barber.name}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-top transition-transform hover:scale-105 duration-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-neutral-950/80 backdrop-blur-sm text-[11px] font-semibold text-amber-400 flex items-center gap-1 border border-neutral-800">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{barber.rating.toFixed(1)}</span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-white mb-1">{barber.name}</h3>
                    <p className="text-xs font-medium text-amber-400/90 mb-2">{barber.role}</p>
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed mb-3">
                      {barber.bio}
                    </p>

                    {/* Specialties clean text */}
                    <div className="text-[11px] text-neutral-500 leading-tight mb-4">
                      {barber.specialties.join(' · ')}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-neutral-800/80 text-xs">
                    <span className="text-neutral-400">{barber.reviewCount} avaliações</span>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-amber-500 border-amber-500 text-neutral-950'
                          : 'border-neutral-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-900 text-sm font-medium transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm tracking-wide transition-all shadow-md shadow-amber-500/10 cursor-pointer"
            >
              <span>Avançar para Data & Horário</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: DATE & TIME */}
      {currentStep === 3 && (
        <div className="space-y-8">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-display mb-2">
              3. Escolha a Data e Horário
            </h2>
            <p className="text-sm text-neutral-400">
              Profissional:{' '}
              <span className="text-white font-semibold">{effectiveBarber.name}</span> · Duração do
              serviço:{' '}
              <span className="text-amber-400 font-semibold">{selectedService.durationMinutes} min</span>
            </p>
          </div>

          {/* Date Picker Strip */}
          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-neutral-400 mb-3">
              Selecione o Dia
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {availableDays.map((day) => {
                const isSelected = selectedDate === day.dateStr;
                const worksThisDay = effectiveBarber.workingDays.includes(day.dayOfWeek);

                return (
                  <button
                    key={day.dateStr}
                    type="button"
                    disabled={!worksThisDay}
                    onClick={() => {
                      setSelectedDate(day.dateStr);
                      setSelectedTime(''); // reset slot when day changes
                    }}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      !worksThisDay
                        ? 'opacity-40 border-neutral-900 bg-neutral-950 cursor-not-allowed'
                        : isSelected
                        ? 'bg-amber-500 border-amber-400 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                        : 'bg-neutral-900/80 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-900'
                    }`}
                  >
                    <span className="text-[11px] uppercase tracking-wider font-medium opacity-80">
                      {day.isToday ? 'Hoje' : day.isTomorrow ? 'Amanhã' : day.dayName}
                    </span>
                    <span className="text-lg font-bold tabular-nums my-0.5">{day.dayOfMonth}</span>
                    <span className="text-[10px] opacity-75">{day.monthName}</span>
                    {!worksThisDay && (
                      <span className="text-[9px] text-red-400 mt-1">Folga</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Title & Slot Groups */}
          <div className="bg-neutral-900/70 border border-neutral-800/80 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-neutral-800 gap-2">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">
                  Horários para {formatFullDate(selectedDate)}
                </h3>
              </div>
              <div className="text-xs text-neutral-400">
                Atendimento: {effectiveBarber.workingHours.start} às {effectiveBarber.workingHours.end}
              </div>
            </div>

            {timeSlots.length === 0 ? (
              <div className="py-8 text-center text-neutral-400 text-sm">
                O profissional não possui horários disponíveis para este dia. Por favor, escolha outra data.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Morning Slots */}
                {slotsGrouped.morning.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold tracking-wider uppercase text-neutral-400 mb-3">
                      Manhã
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {slotsGrouped.morning.map((slot) => {
                        const isSelected = selectedTime === slot.time;
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => setSelectedTime(slot.time)}
                            className={`py-2.5 px-3 rounded-lg text-xs font-semibold tabular-nums border transition-all cursor-pointer ${
                              !slot.available
                                ? 'bg-neutral-950 border-neutral-800 text-neutral-600 cursor-not-allowed line-through'
                                : isSelected
                                ? 'bg-amber-500 border-amber-400 text-neutral-950 font-bold shadow-sm shadow-amber-500/20'
                                : 'bg-neutral-900 border-neutral-800 text-neutral-200 hover:border-neutral-700 hover:bg-neutral-800'
                            }`}
                          >
                            {slot.time}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Afternoon Slots */}
                {slotsGrouped.afternoon.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold tracking-wider uppercase text-neutral-400 mb-3">
                      Tarde
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {slotsGrouped.afternoon.map((slot) => {
                        const isSelected = selectedTime === slot.time;
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => setSelectedTime(slot.time)}
                            className={`py-2.5 px-3 rounded-lg text-xs font-semibold tabular-nums border transition-all cursor-pointer ${
                              !slot.available
                                ? 'bg-neutral-950 border-neutral-800 text-neutral-600 cursor-not-allowed line-through'
                                : isSelected
                                ? 'bg-amber-500 border-amber-400 text-neutral-950 font-bold shadow-sm shadow-amber-500/20'
                                : 'bg-neutral-900 border-neutral-800 text-neutral-200 hover:border-neutral-700 hover:bg-neutral-800'
                            }`}
                          >
                            {slot.time}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Evening Slots */}
                {slotsGrouped.evening.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold tracking-wider uppercase text-neutral-400 mb-3">
                      Noite
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {slotsGrouped.evening.map((slot) => {
                        const isSelected = selectedTime === slot.time;
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => setSelectedTime(slot.time)}
                            className={`py-2.5 px-3 rounded-lg text-xs font-semibold tabular-nums border transition-all cursor-pointer ${
                              !slot.available
                                ? 'bg-neutral-950 border-neutral-800 text-neutral-600 cursor-not-allowed line-through'
                                : isSelected
                                ? 'bg-amber-500 border-amber-400 text-neutral-950 font-bold shadow-sm shadow-amber-500/20'
                                : 'bg-neutral-900 border-neutral-800 text-neutral-200 hover:border-neutral-700 hover:bg-neutral-800'
                            }`}
                          >
                            {slot.time}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Time summary feedback */}
          {selectedTime && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Horário reservado:{' '}
                  <strong>
                    {selectedTime} às {calculateEndTime(selectedTime, selectedService.durationMinutes)}
                  </strong>{' '}
                  ({selectedService.durationMinutes} minutos de atendimento)
                </span>
              </span>
              <span className="font-semibold text-amber-400">Confirmar no próximo passo</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-900 text-sm font-medium transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
            <button
              disabled={!selectedTime}
              onClick={() => setCurrentStep(4)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm tracking-wide transition-all ${
                selectedTime
                  ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md shadow-amber-500/10 cursor-pointer'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              }`}
            >
              <span>Avançar para Seus Dados</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: CUSTOMER DATA & CONFIRMATION SUMMARY */}
      {currentStep === 4 && (
        <div className="space-y-8">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-display mb-2">
              4. Seus Dados e Confirmação
            </h2>
            <p className="text-sm text-neutral-400">
              Preencha suas informações para confirmarmos sua reserva. Enviamos um lembrete no WhatsApp.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Customer Form */}
            <form onSubmit={handleConfirmBooking} className="lg:col-span-7 space-y-4">
              <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-400" />
                    <span>Informações de Contato</span>
                  </h3>
                  {currentUser ? (
                    <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Preenchido da sua conta ({currentUser.name.split(' ')[0]})</span>
                    </div>
                  ) : onOpenAuthModal ? (
                    <button
                      type="button"
                      onClick={onOpenAuthModal}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 cursor-pointer"
                    >
                      Já tem conta? Entrar
                    </button>
                  ) : null}
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Nome Completo *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Eduardo Silva"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-amber-400" />
                      <span>WhatsApp / Telefone *</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="(11) 99999-9999"
                      value={customerPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-neutral-500" />
                      <span>E-mail (opcional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="carlos@exemplo.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center gap-1">
                    <FileText className="w-3 h-3 text-neutral-500" />
                    <span>Observações ou Preferências (opcional)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Prefiro acabamento natural, pele sensível, café expresso..."
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-900 text-sm font-medium transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Alterar Horário</span>
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Confirmando...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar Agendamento</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Booking Summary Card */}
            <div className="lg:col-span-5 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5">
              <h3 className="text-sm font-semibold text-white tracking-wide uppercase flex items-center gap-2 pb-3 border-b border-neutral-800">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Resumo da Reserva</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-neutral-800/60">
                  <span className="text-neutral-400">Serviço:</span>
                  <span className="text-white font-medium text-right">{selectedService.name}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-neutral-800/60">
                  <span className="text-neutral-400">Profissional:</span>
                  <span className="text-white font-medium">{effectiveBarber.name}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-neutral-800/60">
                  <span className="text-neutral-400">Data:</span>
                  <span className="text-white font-medium">{formatFullDate(selectedDate)}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-neutral-800/60">
                  <span className="text-neutral-400">Horário:</span>
                  <span className="text-amber-400 font-semibold tabular-nums">
                    {selectedTime} às {calculateEndTime(selectedTime, selectedService.durationMinutes)}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-neutral-800/60">
                  <span className="text-neutral-400">Duração Total:</span>
                  <span className="text-neutral-300">{selectedService.durationMinutes} minutos</span>
                </div>

                <div className="flex justify-between items-baseline pt-2">
                  <span className="text-sm font-semibold text-white">Valor a Pagar:</span>
                  <span className="text-xl font-bold text-amber-400 tabular-nums">
                    {formatCurrency(selectedService.price)}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500">
                  * Pagamento realizado diretamente na barbearia (Pix, Cartão ou Dinheiro).
                </p>
              </div>

              {/* Supabase Storage Notice */}
              <div className="pt-3 border-t border-neutral-800 text-[11px] text-neutral-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {isSupabaseConnected
                    ? 'Armazenamento em Nuvem Supabase ativo.'
                    : 'Agendamento salvo com persistência local e sincronização pronta para Supabase.'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: SUCCESS VOUCHER & CONFIRMATION */}
      {currentStep === 5 && confirmedAppointment && (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display mb-1">
              Agendamento Confirmado!
            </h2>
            <p className="text-sm text-neutral-400">
              Seu horário está reservado com sucesso na Barbearia Navalha Imperial.
            </p>
          </div>

          {/* Ticket / Voucher Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="bg-amber-500 text-neutral-950 px-6 py-3 flex items-center justify-between">
              <span className="font-brand font-bold text-sm tracking-wider">NAVALHA IMPERIAL</span>
              <span className="text-xs font-mono font-bold tracking-widest">
                #{confirmedAppointment.code}
              </span>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-neutral-500 block mb-0.5">Cliente</span>
                  <span className="text-white font-semibold text-sm">
                    {confirmedAppointment.customerName}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block mb-0.5">Telefone</span>
                  <span className="text-white font-semibold text-sm">
                    {confirmedAppointment.customerPhone}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block mb-0.5">Serviço</span>
                  <span className="text-white font-medium">{confirmedAppointment.serviceName}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block mb-0.5">Barbeiro</span>
                  <span className="text-white font-medium">{confirmedAppointment.barberName}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block mb-0.5">Data</span>
                  <span className="text-white font-medium">
                    {formatFullDate(confirmedAppointment.date)}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block mb-0.5">Horário</span>
                  <span className="text-amber-400 font-bold tabular-nums">
                    {confirmedAppointment.time} às {confirmedAppointment.endTime}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
                <span className="text-neutral-400">Valor total:</span>
                <span className="text-base font-bold text-amber-400 tabular-nums">
                  {formatCurrency(confirmedAppointment.totalPrice)}
                </span>
              </div>
            </div>

            <div className="px-6 py-3 bg-neutral-950/60 border-t border-neutral-800/80 text-[11px] text-neutral-500 text-center">
              📍 Av. Paulista, 1000 - Jardins, São Paulo (Estacionamento cortesia)
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3 pt-2">
            <a
              href={createWhatsAppConfirmationLink(confirmedAppointment)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors shadow-md shadow-emerald-600/20"
            >
              <Phone className="w-4 h-4" />
              <span>Enviar Confirmação no WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>

            <a
              href={createGoogleCalendarLink(confirmedAppointment)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 font-semibold text-sm transition-colors"
            >
              <CalendarIcon className="w-4 h-4 text-amber-400" />
              <span>Adicionar ao Google Agenda</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>

            <button
              onClick={handleResetBooking}
              className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl text-neutral-400 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Fazer Outro Agendamento</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
