import { Barber, Appointment, TimeSlot } from '../types/index.ts';

// Format currency in BRL
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Convert "HH:MM" to minutes from midnight
export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// Convert minutes from midnight to "HH:MM"
export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Calculate end time given start time and duration in minutes
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const startMin = timeToMinutes(startTime);
  return minutesToTime(startMin + durationMinutes);
}

// Check if two time ranges overlap
export function doRangesOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return Math.max(startA, startB) < Math.min(endA, endB);
}

// Generate available time slots for a specific barber, service duration, and date
export function getAvailableSlots(
  barber: Barber,
  serviceDuration: number,
  dateStr: string,
  appointments: Appointment[]
): TimeSlot[] {
  // Parse date
  const [year, month, day] = dateStr.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);
  const dayOfWeek = targetDate.getDay();

  // Check if barber works on this day
  if (!barber.workingDays.includes(dayOfWeek)) {
    return [];
  }

  const startMinutes = timeToMinutes(barber.workingHours.start);
  const endMinutes = timeToMinutes(barber.workingHours.end);

  const lunchStart = barber.workingHours.lunchStart ? timeToMinutes(barber.workingHours.lunchStart) : null;
  const lunchEnd = barber.workingHours.lunchEnd ? timeToMinutes(barber.workingHours.lunchEnd) : null;

  // Filter existing active appointments for this barber on this date
  const dayAppointments = appointments.filter(
    (app) =>
      app.barberId === barber.id &&
      app.date === dateStr &&
      app.status !== 'cancelled'
  );

  // Check if target date is today to filter out past hours
  const now = new Date();
  const isToday =
    targetDate.getFullYear() === now.getFullYear() &&
    targetDate.getMonth() === now.getMonth() &&
    targetDate.getDate() === now.getDate();
  const currentMinutesNow = now.getHours() * 60 + now.getMinutes();

  const slots: TimeSlot[] = [];
  const stepMinutes = 30; // standard slot interval

  for (let m = startMinutes; m + serviceDuration <= endMinutes; m += stepMinutes) {
    const slotTimeStr = minutesToTime(m);
    const slotEndMinutes = m + serviceDuration;

    // Check lunch collision
    if (lunchStart !== null && lunchEnd !== null) {
      if (doRangesOverlap(m, slotEndMinutes, lunchStart, lunchEnd)) {
        continue; // skip lunch break entirely from slots
      }
    }

    // Check if slot has already passed today
    if (isToday && m <= currentMinutesNow + 15) {
      slots.push({
        time: slotTimeStr,
        available: false,
        reason: 'Horário já passou',
      });
      continue;
    }

    // Check overlap with scheduled appointments
    const overlappingApp = dayAppointments.find((app) => {
      const appStart = timeToMinutes(app.time);
      const appEnd = timeToMinutes(app.endTime);
      return doRangesOverlap(m, slotEndMinutes, appStart, appEnd);
    });

    if (overlappingApp) {
      slots.push({
        time: slotTimeStr,
        available: false,
        reason: 'Reservado',
      });
    } else {
      slots.push({
        time: slotTimeStr,
        available: true,
      });
    }
  }

  return slots;
}

// Generate the next 14 calendar days starting today
export interface DayOption {
  dateStr: string;
  dayOfMonth: number;
  dayName: string;
  monthName: string;
  isToday: boolean;
  isTomorrow: boolean;
  dayOfWeek: number;
}

export function getNextDays(count = 14): DayOption[] {
  const days: DayOption[] = [];
  const today = new Date();

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const monthNames = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    days.push({
      dateStr,
      dayOfMonth: d.getDate(),
      dayName: dayNames[d.getDay()],
      monthName: monthNames[d.getMonth()],
      isToday: i === 0,
      isTomorrow: i === 1,
      dayOfWeek: d.getDay(),
    });
  }

  return days;
}

// Format date into human-readable Portuguese
export function formatFullDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  };
  const formatted = date.toLocaleDateString('pt-BR', options);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

// Create WhatsApp message link
export function createWhatsAppConfirmationLink(app: Appointment, phoneBarbershop = '5511999999999'): string {
  const formattedDate = formatFullDate(app.date);
  const text = encodeURIComponent(
    `💈 *Agendamento Confirmado - Barbearia Navalha Imperial*\n\n` +
    `Código: *#${app.code}*\n` +
    `Cliente: *${app.customerName}*\n` +
    `Serviço: *${app.serviceName}*\n` +
    `Barbeiro: *${app.barberName}*\n` +
    `Data: *${formattedDate}*\n` +
    `Horário: *${app.time} às ${app.endTime}*\n` +
    `Valor: *${formatCurrency(app.totalPrice)}*\n\n` +
    `📍 Endereço: Av. Paulista, 1000 - Jardins, São Paulo\n` +
    `Nos vemos lá!`
  );

  return `https://wa.me/${phoneBarbershop}?text=${text}`;
}

// Create Google Calendar event link
export function createGoogleCalendarLink(app: Appointment): string {
  const [year, month, day] = app.date.split('-');
  const [startH, startM] = app.time.split(':');
  const [endH, endM] = app.endTime.split(':');

  const startISO = `${year}${month}${day}T${startH}${startM}00`;
  const endISO = `${year}${month}${day}T${endH}${endM}00`;

  const title = encodeURIComponent(`Navalha Imperial: ${app.serviceName} com ${app.barberName}`);
  const details = encodeURIComponent(
    `Agendamento #${app.code}\nServiço: ${app.serviceName}\nProfissional: ${app.barberName}\nCliente: ${app.customerName}\nValor: ${formatCurrency(app.totalPrice)}`
  );
  const location = encodeURIComponent('Barbearia Navalha Imperial - Av. Paulista, 1000, São Paulo');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startISO}/${endISO}&details=${details}&location=${location}`;
}
