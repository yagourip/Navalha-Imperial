import { useState } from 'react';
import {
  Scissors,
  Mail,
  Lock,
  User,
  Phone,
  LogIn,
  UserPlus,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight
} from 'lucide-react';
import { AppUser, UserRole } from '../types/index.ts';
import { signIn, signUp, demoLogin, DEMO_ACCOUNTS } from '../services/auth.ts';
import { HERO_IMAGE } from '../data/initialData.ts';

interface LoginPageProps {
  onLoginSuccess: (user: AppUser) => void;
  isSupabaseConnected: boolean;
  onOpenSupabaseConfig: () => void;
}

export function LoginPage({
  onLoginSuccess,
  isSupabaseConnected,
  onOpenSupabaseConfig,
}: LoginPageProps) {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');

  // Form states
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [role, setRole] = useState<UserRole>('customer');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePhoneMask = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) {
      setPhone(digits);
    } else if (digits.length <= 7) {
      setPhone(`(${digits.slice(0, 2)}) ${digits.slice(2)}`);
    } else {
      setPhone(`(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`);
    }
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { user } = await signIn(email, password);
      onLoginSuccess(user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao realizar login.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { user } = await signUp({
        name,
        email,
        password,
        phone,
        role,
      });
      onLoginSuccess(user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao cadastrar.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (demoRole: UserRole) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await demoLogin(demoRole);
      onLoginSuccess(user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao acessar demo.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col lg:flex-row relative">
      {/* Left side: Atmospheric Barbershop Hero Brand Section */}
      <div className="relative w-full lg:w-1/2 min-h-[300px] lg:min-h-screen flex flex-col justify-between p-8 sm:p-12 overflow-hidden border-b lg:border-b-0 lg:border-r border-neutral-800/80">
        {/* Background Image with layered scrims */}
        <div className="absolute inset-0 z-0">
          <img
            src={HERO_IMAGE}
            alt="Interior da Barbearia Navalha Imperial"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center filter grayscale-[30%] brightness-[0.4]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-transparent to-neutral-950/90" />
        </div>

        {/* Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Scissors className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <span className="font-brand text-xl font-bold tracking-widest text-white block">
                NAVALHA IMPERIAL
              </span>
              <span className="text-xs text-amber-400/90 font-medium tracking-wider uppercase">
                Barbearia & Atendimento Exclusivo
              </span>
            </div>
          </div>
        </div>

        {/* Middle Highlights */}
        <div className="relative z-10 my-8 lg:my-0 max-w-md">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Agendamento Inteligente Online</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-display leading-tight mb-4">
            A tradição do corte fino com a conveniência do agendamento digital.
          </h1>
          <p className="text-sm text-neutral-300 leading-relaxed">
            Faça login para escolher seu barbeiro de preferência, consultar horários livres em tempo real e gerenciar seus atendimentos com facilidade.
          </p>

          <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-neutral-800/80 text-xs text-neutral-300">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Horários em tempo real</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Sem filas ou espera</span>
            </div>
          </div>
        </div>

        {/* Footer info on left */}
        <div className="relative z-10 text-xs text-neutral-500 flex items-center justify-between">
          <span>Av. Paulista, 1000 - Jardins, SP</span>
          <span>© {new Date().getFullYear()} Navalha Imperial</span>
        </div>
      </div>

      {/* Right side: Login & Registration Gate */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 z-10">
        <div className="w-full max-w-md space-y-6">
          {/* Header Title */}
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-bold text-white tracking-tight font-display mb-1.5">
              {tab === 'signin' ? 'Acesse sua Conta' : 'Crie seu Cadastro'}
            </h2>
            <p className="text-xs text-neutral-400">
              {tab === 'signin'
                ? 'Entre para agendar e visualizar seus horários reservados.'
                : 'Cadastre-se rapidamente para começar a agendar seus cortes.'}
            </p>
          </div>

          {/* Quick 1-Click Demo Profiles */}
          <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
                Acesso Rápido de Teste (1 Clique)
              </span>
              <span className="text-[10px] text-neutral-500 font-normal">Preenchimento automático</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickDemo(acc.role)}
                  disabled={isLoading}
                  className="px-2.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/60 hover:bg-neutral-900 text-neutral-200 text-xs font-semibold transition-all cursor-pointer text-center truncate disabled:opacity-50"
                  title={acc.description}
                >
                  {acc.roleLabel}
                </button>
              ))}
            </div>
          </div>

          {/* Segmented Tab Switcher */}
          <div className="flex p-1 bg-neutral-900 border border-neutral-800 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setTab('signin');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                tab === 'signin'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('signup');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                tab === 'signup'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Criar Conta</span>
            </button>
          </div>

          {/* Form: Sign In */}
          {tab === 'signin' ? (
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-neutral-400" />
                  <span>E-mail</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-900/90 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Senha</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-900/90 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs tracking-wide transition-all shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>Acessando...</span>
                ) : (
                  <>
                    <span>Entrar no Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Form: Sign Up */
            <form onSubmit={handleSignUpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Nome Completo *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-neutral-900/90 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-neutral-400" />
                  <span>E-mail *</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="carlos@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-900/90 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Senha (mín 6) *</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-neutral-900/90 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                    <span>WhatsApp</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={phone}
                    onChange={(e) => handlePhoneMask(e.target.value)}
                    className="w-full bg-neutral-900/90 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              {/* Profile Type */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Tipo de Conta
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('customer')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                      role === 'customer'
                        ? 'bg-amber-500 text-neutral-950 border-amber-400 font-bold'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Cliente
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('barber')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                      role === 'barber'
                        ? 'bg-amber-500 text-neutral-950 border-amber-400 font-bold'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Barbeiro / Equipe
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs tracking-wide transition-all shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>Criando conta...</span>
                ) : (
                  <>
                    <span>Concluir Cadastro & Entrar</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick guest option */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => handleQuickDemo('customer')}
              className="text-xs text-neutral-400 hover:text-amber-400 underline underline-offset-4 transition-colors cursor-pointer"
            >
              Continuar direto como Cliente Visitante
            </button>
          </div>

          {/* Database Notice & corner Supabase config trigger */}
          <div className="pt-4 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
              <span>
                {isSupabaseConnected ? 'Conectado ao Supabase' : 'Sessão local segura'}
              </span>
            </span>

            <button
              type="button"
              onClick={onOpenSupabaseConfig}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              Configurar Banco
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
