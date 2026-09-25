import { Appointment, AppointmentStatus } from '../types/index.ts';
import { getInitialAppointments } from '../data/initialData.ts';
import { getSupabaseClient } from '../lib/supabase.ts';

const LOCAL_STORAGE_KEY = 'navalha_imperial_appointments_v1';

// Convert DB snake_case row to App Appointment camelCase
interface SupabaseAppointmentRow {
  id: string;
  code: string;
  barber_id: string;
  barber_name: string;
  service_id: string;
  service_name: string;
  service_duration: number;
  total_price: number | string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  notes?: string | null;
  date: string;
  time: string;
  end_time: string;
  status: AppointmentStatus;
  created_at: string;
}

function mapRowToAppointment(row: SupabaseAppointmentRow): Appointment {
  return {
    id: row.id,
    code: row.code,
    barberId: row.barber_id,
    barberName: row.barber_name,
    serviceId: row.service_id,
    serviceName: row.service_name,
    serviceDuration: Number(row.service_duration),
    totalPrice: Number(row.total_price),
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email || undefined,
    notes: row.notes || undefined,
    date: row.date,
    time: row.time,
    endTime: row.end_time,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapAppointmentToRow(app: Appointment): SupabaseAppointmentRow {
  return {
    id: app.id,
    code: app.code,
    barber_id: app.barberId,
    barber_name: app.barberName,
    service_id: app.serviceId,
    service_name: app.serviceName,
    service_duration: app.serviceDuration,
    total_price: app.totalPrice,
    customer_name: app.customerName,
    customer_phone: app.customerPhone,
    customer_email: app.customerEmail || null,
    notes: app.notes || null,
    date: app.date,
    time: app.time,
    end_time: app.endTime,
    status: app.status,
    created_at: app.createdAt,
  };
}

// Read local cache
export function getLocalAppointments(): Appointment[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      const initial = getInitialAppointments();
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading appointments from localStorage:', err);
    return getInitialAppointments();
  }
}

// Save local cache
export function saveLocalAppointments(appointments: Appointment[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(appointments));
    window.dispatchEvent(new CustomEvent('appointments_updated'));
  } catch (err) {
    console.error('Error saving appointments to localStorage:', err);
  }
}

// Fetch all appointments (attempts Supabase first, falls back to local storage)
export async function fetchAppointments(): Promise<{
  data: Appointment[];
  source: 'supabase' | 'local';
  error?: string;
}> {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) {
        console.warn('Supabase fetch error, using local data:', error.message);
        return {
          data: getLocalAppointments(),
          source: 'local',
          error: error.message,
        };
      }

      if (data && data.length > 0) {
        const mapped = (data as SupabaseAppointmentRow[]).map(mapRowToAppointment);
        // Update local cache as backup
        saveLocalAppointments(mapped);
        return { data: mapped, source: 'supabase' };
      } else {
        // If Supabase table is empty, seed it with the initial local appointments
        const local = getLocalAppointments();
        if (local.length > 0) {
          try {
            const rowsToInsert = local.map(mapAppointmentToRow);
            await supabase.from('appointments').insert(rowsToInsert);
          } catch (insertErr) {
            console.warn('Could not auto-seed empty Supabase table:', insertErr);
          }
        }
        return { data: local, source: 'supabase' };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha na conexão Supabase';
      console.warn('Supabase query failed, using local storage:', message);
      return {
        data: getLocalAppointments(),
        source: 'local',
        error: message,
      };
    }
  }

  return { data: getLocalAppointments(), source: 'local' };
}

// Save a newly created appointment
export async function createAppointment(appointment: Appointment): Promise<{
  success: boolean;
  appointment: Appointment;
  savedToSupabase: boolean;
  error?: string;
}> {
  // Always update local cache first for instant feedback
  const localList = getLocalAppointments();
  const updatedList = [appointment, ...localList.filter((a) => a.id !== appointment.id)];
  saveLocalAppointments(updatedList);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const row = mapAppointmentToRow(appointment);
      const { error } = await supabase.from('appointments').insert([row]);

      if (error) {
        console.warn('Saved locally, but failed to insert to Supabase:', error.message);
        return {
          success: true,
          appointment,
          savedToSupabase: false,
          error: error.message,
        };
      }
      return { success: true, appointment, savedToSupabase: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar no Supabase';
      return {
        success: true,
        appointment,
        savedToSupabase: false,
        error: message,
      };
    }
  }

  return { success: true, appointment, savedToSupabase: false };
}

// Update appointment status (scheduled -> completed | cancelled)
export async function updateAppointmentStatus(
  id: string,
  newStatus: AppointmentStatus
): Promise<boolean> {
  // Update local
  const current = getLocalAppointments();
  const updated = current.map((app) => (app.id === id ? { ...app, status: newStatus } : app));
  saveLocalAppointments(updated);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('appointments').update({ status: newStatus }).eq('id', id);
    } catch (err) {
      console.warn('Could not update status in Supabase:', err);
    }
  }

  return true;
}

// Sync all local appointments to Supabase
export async function syncLocalToSupabase(): Promise<{
  synced: number;
  error?: string;
}> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { synced: 0, error: 'Supabase não está configurado.' };
  }

  const local = getLocalAppointments();
  if (local.length === 0) {
    return { synced: 0 };
  }

  try {
    const rows = local.map(mapAppointmentToRow);
    const { error } = await supabase.from('appointments').upsert(rows, { onConflict: 'id' });

    if (error) {
      return { synced: 0, error: error.message };
    }

    return { synced: rows.length };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro na sincronização.';
    return { synced: 0, error: message };
  }
}

// Subscribe to real-time changes
export function subscribeToAppointments(onUpdate: () => void): () => void {
  // Listen for local tab events
  const localHandler = () => {
    onUpdate();
  };
  window.addEventListener('appointments_updated', localHandler);
  window.addEventListener('storage', localHandler);

  const supabase = getSupabaseClient();
  let channel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null;

  if (supabase) {
    try {
      channel = supabase
        .channel('public:appointments')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'appointments' },
          () => {
            onUpdate();
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Realtime subscription not available:', err);
    }
  }

  return () => {
    window.removeEventListener('appointments_updated', localHandler);
    window.removeEventListener('storage', localHandler);
    if (channel && supabase) {
      supabase.removeChannel(channel);
    }
  };
}
