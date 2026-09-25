import { Barber, Service, Appointment } from '../types/index.ts';

export const HERO_IMAGE = '/src/assets/images/barbershop_hero_1790363053444.jpg';

export const INITIAL_BARBERS: Barber[] = [
  {
    id: 'barber-marcos',
    name: 'Marcos Viana',
    role: 'Master Barber & Fundador',
    bio: 'Mais de 14 anos de experiência com cortes clássicos na tesoura e visagismo masculino personalizado.',
    photoUrl: '/src/assets/images/barber_marcos_1790363063841.jpg',
    rating: 4.9,
    reviewCount: 342,
    specialties: ['Cortes Clássicos', 'Tesoura de Alta Precisão', 'Visagismo'],
    workingHours: {
      start: '09:00',
      end: '19:00',
      lunchStart: '12:30',
      lunchEnd: '13:30',
    },
    workingDays: [1, 2, 3, 4, 5, 6], // Segunda a Sábado
  },
  {
    id: 'barber-rafael',
    name: 'Rafael Rocha',
    role: 'Especialista em Fade & Freestyle',
    bio: 'Referência em degradês perfeitos (Skin Fade, Taper, Low Fade) e finalizações modernas com textura.',
    photoUrl: '/src/assets/images/barber_rafael_1790363073301.jpg',
    rating: 4.8,
    reviewCount: 289,
    specialties: ['Skin Fade', 'Taper Fade', 'Texturização', 'Penteados'],
    workingHours: {
      start: '10:00',
      end: '20:00',
      lunchStart: '13:00',
      lunchEnd: '14:00',
    },
    workingDays: [1, 2, 3, 4, 5, 6],
  },
  {
    id: 'barber-diego',
    name: 'Diego Alencar',
    role: 'Terapeuta da Barba & Visagista',
    bio: 'Especialista na tradicional barboterapia com toalha quente, óleos aromáticos e alinhamento de navalha.',
    photoUrl: '/src/assets/images/barber_diego_1790363082808.jpg',
    rating: 5.0,
    reviewCount: 215,
    specialties: ['Barboterapia', 'Toalha Quente', 'Tratamento de Fios', 'Alinhamento'],
    workingHours: {
      start: '09:00',
      end: '19:00',
      lunchStart: '12:00',
      lunchEnd: '13:00',
    },
    workingDays: [2, 3, 4, 5, 6], // Terça a Sábado
  },
];

export const INITIAL_SERVICES: Service[] = [
  {
    id: 'srv-combo-imperial',
    name: 'Combo Imperial (Cabelo + Barba)',
    category: 'combos',
    durationMinutes: 70,
    price: 95.0,
    description: 'Corte completo personalizado + Barboterapia relaxante com toalha quente e finalização com balm e óleo nobre.',
    popular: true,
  },
  {
    id: 'srv-corte-classico',
    name: 'Corte Tradicional / Degradê',
    category: 'cabelo',
    durationMinutes: 45,
    price: 60.0,
    description: 'Higienização inicial, corte na tesoura ou máquina (fade, clássico ou moderno), lavagem e styling com pomada matte.',
    popular: true,
  },
  {
    id: 'srv-barboterapia',
    name: 'Barboterapia com Toalha Quente',
    category: 'barba',
    durationMinutes: 35,
    price: 50.0,
    description: 'Tratamento de pele com toalhas quentes aromáticas, esfoliação suave, desenho preciso na navalha e hidratação profunda.',
  },
  {
    id: 'srv-camuflagem',
    name: 'Camuflagem de Fios Grisalhos',
    category: 'especial',
    durationMinutes: 30,
    price: 45.0,
    description: 'Pigmentação natural e discreta para amenizar cabelos brancos ou preencher falhas sutis na barba sem aspecto artificial.',
  },
  {
    id: 'srv-sobrancelha',
    name: 'Design de Sobrancelha na Navalha',
    category: 'especial',
    durationMinutes: 15,
    price: 25.0,
    description: 'Limpeza e alinhamento do contorno das sobrancelhas mantendo a naturalidade da expressão masculina.',
  },
  {
    id: 'srv-spa-completo',
    name: 'Experiência VIP Spa da Navalha',
    category: 'combos',
    durationMinutes: 90,
    price: 140.0,
    description: 'Corte de alta precisão + Barboterapia completa + Massagem capilar + Esfoliação facial revitalizante + Café gourmet ou cerveja artesanal cortesia.',
  },
];

// Helper to generate a realistic appointment code
export function generateAppointmentCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'IMP-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate some initial appointments for today and tomorrow to give life to the system
export const getInitialAppointments = (): Appointment[] => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  return [
    {
      id: 'app-001',
      code: 'IMP-7482',
      barberId: 'barber-marcos',
      barberName: 'Marcos Viana',
      serviceId: 'srv-corte-classico',
      serviceName: 'Corte Tradicional / Degradê',
      serviceDuration: 45,
      totalPrice: 60.0,
      customerName: 'Gabriel Siqueira',
      customerPhone: '(11) 98765-4321',
      customerEmail: 'gabriel.s@email.com',
      notes: 'Prefere acabamento quadrado no pescoço',
      date: todayStr,
      time: '10:00',
      endTime: '10:45',
      status: 'scheduled',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'app-002',
      code: 'IMP-9104',
      barberId: 'barber-rafael',
      barberName: 'Rafael Rocha',
      serviceId: 'srv-combo-imperial',
      serviceName: 'Combo Imperial (Cabelo + Barba)',
      serviceDuration: 70,
      totalPrice: 95.0,
      customerName: 'Lucas Medeiros',
      customerPhone: '(11) 99123-8877',
      customerEmail: 'lucas.m@email.com',
      notes: 'Primeira vez na barbearia',
      date: todayStr,
      time: '14:00',
      endTime: '15:10',
      status: 'scheduled',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'app-003',
      code: 'IMP-3319',
      barberId: 'barber-diego',
      barberName: 'Diego Alencar',
      serviceId: 'srv-barboterapia',
      serviceName: 'Barboterapia com Toalha Quente',
      serviceDuration: 35,
      totalPrice: 50.0,
      customerName: 'Eduardo Fontes',
      customerPhone: '(11) 97654-1234',
      customerEmail: 'eduardo@fontes.com',
      notes: 'Pele sensível no queixo',
      date: tomorrowStr,
      time: '11:00',
      endTime: '11:35',
      status: 'scheduled',
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
  ];
};
