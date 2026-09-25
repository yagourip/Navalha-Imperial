export interface Barber {
  id: string;
  name: string;
  role: string;
  bio: string;
  photoUrl: string;
  rating: number;
  reviewCount: number;
  specialties: string[];
  workingHours: {
    start: string; // e.g. "09:00"
    end: string;   // e.g. "20:00"
    lunchStart?: string; // e.g. "12:00"
    lunchEnd?: string;   // e.g. "13:00"
  };
  workingDays: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
}

export type ServiceCategory = 'cabelo' | 'barba' | 'combos' | 'especial';

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  durationMinutes: number;
  price: number;
  description: string;
  popular?: boolean;
}

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  code: string;
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
  serviceDuration: number;
  totalPrice: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  notes?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  endTime: string; // HH:MM
  status: AppointmentStatus;
  createdAt: string;
}

export interface TimeSlot {
  time: string; // "09:00"
  available: boolean;
  reason?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastTestedAt?: string;
}

export interface BookingFormData {
  serviceId: string;
  barberId: string;
  date: string;
  time: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  notes: string;
}

export type UserRole = 'customer' | 'barber' | 'admin';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  barberId?: string;
  avatarUrl?: string;
}

