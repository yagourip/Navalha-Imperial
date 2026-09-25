import { AppUser, UserRole } from '../types/index.ts';
import { getSupabaseClient } from '../lib/supabase.ts';

const USER_SESSION_KEY = 'navalha_imperial_current_user_v1';
const USERS_DB_KEY = 'navalha_imperial_registered_users_v1';

export const DEMO_ACCOUNTS: Array<{
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  roleLabel: string;
  barberId?: string;
  description: string;
}> = [
  {
    email: 'cliente@navalha.com',
    name: 'Lucas Silva',
    phone: '(11) 98765-4321',
    role: 'customer',
    roleLabel: 'Cliente',
    description: 'Acessa agendamentos pessoais e preenchimento automático no agendador',
  },
  {
    email: 'marcos@navalha.com',
    name: 'Marcos Viana',
    phone: '(11) 99123-4567',
    role: 'barber',
    roleLabel: 'Barbeiro Master',
    barberId: 'barber-marcos',
    description: 'Acesso completo ao painel de agenda, atendimentos e encaixes',
  },
  {
    email: 'admin@navalha.com',
    name: 'Administração Imperial',
    phone: '(11) 99999-0000',
    role: 'admin',
    roleLabel: 'Administrador / Gestor',
    description: 'Controle total da barbearia, métricas de faturamento e equipe',
  },
];

// Initialize registered users storage with default demo users
function getStoredUsers(): Array<AppUser & { passwordHash: string }> {
  try {
    const raw = localStorage.getItem(USERS_DB_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Error reading stored users:', err);
  }

  // Seed default demo accounts
  const seeded: Array<AppUser & { passwordHash: string }> = [
    {
      id: 'usr_cliente_01',
      email: 'cliente@navalha.com',
      name: 'Lucas Silva',
      phone: '(11) 98765-4321',
      role: 'customer',
      passwordHash: '123456',
    },
    {
      id: 'usr_barber_01',
      email: 'marcos@navalha.com',
      name: 'Marcos Viana',
      phone: '(11) 99123-4567',
      role: 'barber',
      barberId: 'barber-marcos',
      passwordHash: '123456',
    },
    {
      id: 'usr_admin_01',
      email: 'admin@navalha.com',
      name: 'Administração Imperial',
      phone: '(11) 99999-0000',
      role: 'admin',
      passwordHash: '123456',
    },
  ];

  try {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(seeded));
  } catch (e) {
    console.error(e);
  }

  return seeded;
}

function saveStoredUsers(users: Array<AppUser & { passwordHash: string }>): void {
  try {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save users database:', err);
  }
}

// Current logged in user
export function getCurrentUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(USER_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading current user session:', err);
    return null;
  }
}

function saveUserSession(user: AppUser | null): void {
  try {
    if (user) {
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_SESSION_KEY);
    }
    window.dispatchEvent(new CustomEvent('auth_state_changed', { detail: user }));
  } catch (err) {
    console.error('Error saving user session:', err);
  }
}

// Sign In
export async function signIn(
  emailInput: string,
  passwordInput: string
): Promise<{ user: AppUser; isSupabaseAuth: boolean }> {
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput.trim();

  const supabase = getSupabaseClient();

  // If Supabase is connected, try Supabase Auth first
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data?.user) {
        const metadata = data.user.user_metadata || {};
        const appUser: AppUser = {
          id: data.user.id,
          email: data.user.email || email,
          name: metadata.name || email.split('@')[0],
          phone: metadata.phone || '',
          role: metadata.role || 'customer',
          barberId: metadata.barberId,
        };

        saveUserSession(appUser);
        return { user: appUser, isSupabaseAuth: true };
      }
      // If error was invalid credentials or user not found on Supabase,
      // fallback to check local users store (useful for demo accounts)
    } catch (err) {
      console.warn('Supabase auth sign in error, checking local store:', err);
    }
  }

  // Local / Demo authentication fallback
  const storedUsers = getStoredUsers();
  const found = storedUsers.find((u) => u.email.toLowerCase() === email);

  if (!found) {
    throw new Error('Usuário não encontrado. Verifique o e-mail ou crie uma conta.');
  }

  if (found.passwordHash !== password) {
    throw new Error('Senha incorreta. Tente novamente ou use o login rápido de teste.');
  }

  const { passwordHash: _, ...cleanUser } = found;
  saveUserSession(cleanUser);
  return { user: cleanUser, isSupabaseAuth: false };
}

// Sign Up
export async function signUp(params: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
  barberId?: string;
}): Promise<{ user: AppUser; isSupabaseAuth: boolean }> {
  const name = params.name.trim();
  const email = params.email.trim().toLowerCase();
  const password = params.password.trim();
  const phone = params.phone?.trim() || '';
  const role: UserRole = params.role || 'customer';

  if (!email || !password || !name) {
    throw new Error('Preencha todos os campos obrigatórios.');
  }

  if (password.length < 6) {
    throw new Error('A senha deve conter pelo menos 6 caracteres.');
  }

  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone,
            role,
            barberId: params.barberId,
          },
        },
      });

      if (!error && data?.user) {
        const appUser: AppUser = {
          id: data.user.id,
          email: data.user.email || email,
          name,
          phone,
          role,
          barberId: params.barberId,
        };

        saveUserSession(appUser);
        return { user: appUser, isSupabaseAuth: true };
      }
    } catch (err) {
      console.warn('Supabase auth signUp error, registering in local store:', err);
    }
  }

  // Local storage registration
  const stored = getStoredUsers();
  const exists = stored.find((u) => u.email.toLowerCase() === email);

  if (exists) {
    throw new Error('Já existe uma conta com este e-mail. Por favor, faça login.');
  }

  const newUser: AppUser & { passwordHash: string } = {
    id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    email,
    name,
    phone,
    role,
    barberId: params.barberId,
    passwordHash: password,
  };

  stored.push(newUser);
  saveStoredUsers(stored);

  const { passwordHash: _, ...cleanUser } = newUser;
  saveUserSession(cleanUser);
  return { user: cleanUser, isSupabaseAuth: false };
}

// Instant Demo Login helper
export async function demoLogin(role: UserRole): Promise<AppUser> {
  const demoAccount = DEMO_ACCOUNTS.find((d) => d.role === role) || DEMO_ACCOUNTS[0];

  const appUser: AppUser = {
    id: `demo_${demoAccount.role}`,
    email: demoAccount.email,
    name: demoAccount.name,
    phone: demoAccount.phone,
    role: demoAccount.role,
    barberId: demoAccount.barberId,
  };

  saveUserSession(appUser);
  return appUser;
}

// Sign Out
export async function signOut(): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase signOut error:', e);
    }
  }
  saveUserSession(null);
}

// Subscribe to auth state updates
export function subscribeToAuth(callback: (user: AppUser | null) => void): () => void {
  const handler = (event: Event) => {
    const custom = event as CustomEvent<AppUser | null>;
    callback(custom.detail !== undefined ? custom.detail : getCurrentUser());
  };

  window.addEventListener('auth_state_changed', handler);
  window.addEventListener('storage', () => callback(getCurrentUser()));

  // Also listen to Supabase auth events if connected
  const supabase = getSupabaseClient();
  let sub: { unsubscribe: () => void } | null = null;

  if (supabase) {
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const metadata = session.user.user_metadata || {};
          const appUser: AppUser = {
            id: session.user.id,
            email: session.user.email || '',
            name: metadata.name || session.user.email?.split('@')[0] || 'Usuário',
            phone: metadata.phone || '',
            role: metadata.role || 'customer',
            barberId: metadata.barberId,
          };
          saveUserSession(appUser);
          callback(appUser);
        } else {
          // If session ended on Supabase, don't necessarily wipe if local demo is active
        }
      });
      sub = data.subscription;
    } catch (e) {
      console.warn('Could not listen to Supabase auth changes', e);
    }
  }

  return () => {
    window.removeEventListener('auth_state_changed', handler);
    if (sub) {
      sub.unsubscribe();
    }
  };
}
