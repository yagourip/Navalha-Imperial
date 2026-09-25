import { useState } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Trash2,
  Code
} from 'lucide-react';
import { SupabaseConfig } from '../types/index.ts';
import {
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
  SUPABASE_SQL_SCHEMA,
} from '../lib/supabase.ts';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SupabaseConfig;
  onConfigUpdated: () => void;
  onSyncNow: () => Promise<void>;
  isSyncing: boolean;
}

export function SupabaseModal({
  isOpen,
  onClose,
  config,
  onConfigUpdated,
  onSyncNow,
  isSyncing,
}: SupabaseModalProps) {
  const [activeTab, setActiveTab] = useState<'config' | 'sql'>('config');
  const [url, setUrl] = useState<string>(config.url || '');
  const [anonKey, setAnonKey] = useState<string>(config.anonKey || '');
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);

    const res = await testSupabaseConnection(url, anonKey);
    setTestResult(res);
    setTesting(false);

    if (res.success) {
      saveSupabaseConfig(url, anonKey, true);
      onConfigUpdated();
    }
  };

  const handleClear = () => {
    if (window.confirm('Deseja remover as credenciais do Supabase configuradas neste navegador?')) {
      clearSupabaseConfig();
      setUrl('');
      setAnonKey('');
      setTestResult(null);
      onConfigUpdated();
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white font-display">
              Armazenamento em Nuvem (Supabase)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-800 px-6 pt-2 bg-neutral-950/40">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'config'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Conexão & Credenciais
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sql'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Script SQL (Tabela appointments)</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'config' ? (
            <div className="space-y-6">
              {/* Status Banner */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  config.isConnected
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-300'
                }`}
              >
                {config.isConnected ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="text-xs space-y-1">
                  <div className="font-semibold text-white">
                    {config.isConnected
                      ? 'Conectado ao seu projeto Supabase'
                      : 'Modo Offline / LocalStorage Ativo'}
                  </div>
                  <p className="text-neutral-400 leading-relaxed">
                    {config.isConnected
                      ? 'Todos os novos agendamentos são persistidos e lidos diretamente do seu banco de dados Supabase na nuvem.'
                      : 'O sistema está gravando localmente no navegador. Insira as credenciais do seu projeto Supabase abaixo para ativar a nuvem.'}
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleTestAndSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Supabase Project URL *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://exemplo-id.supabase.co"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Encontrado em: <strong>Project Settings &gt; API &gt; Project URL</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Supabase Anon Public API Key *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Encontrado em: <strong>Project Settings &gt; API &gt; Project API keys &gt; anon public</strong>
                  </p>
                </div>

                {testResult && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs flex items-start gap-2 ${
                      testResult.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-red-500/10 border-red-500/30 text-red-300'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    {config.isConnected && (
                      <button
                        type="button"
                        onClick={handleClear}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-red-400 hover:border-red-500/30 text-xs transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Desconectar</span>
                      </button>
                    )}

                    {config.isConnected && (
                      <button
                        type="button"
                        onClick={onSyncNow}
                        disabled={isSyncing}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white text-xs transition-colors cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>Sincronizar Dados</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={testing}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs tracking-wide transition-all shadow-md shadow-amber-500/10 cursor-pointer disabled:opacity-50"
                  >
                    {testing ? (
                      <span>Testando conexão...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Testar & Salvar Conexão</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Instructions link */}
              <div className="pt-4 border-t border-neutral-800 text-xs text-neutral-400 flex items-center justify-between">
                <span>Não tem uma conta no Supabase?</span>
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <span>Criar projeto gratuito no Supabase</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ) : (
            /* SQL Schema Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Script SQL para o Supabase</h3>
                  <p className="text-xs text-neutral-400">
                    Copie e cole este script na aba <strong>SQL Editor</strong> do painel do Supabase para criar a tabela com RLS e Realtime.
                  </p>
                </div>
                <button
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-colors cursor-pointer"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Script</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 p-4 font-mono text-[11px] text-neutral-300 leading-relaxed max-h-[360px] overflow-y-auto">
                <pre>{SUPABASE_SQL_SCHEMA}</pre>
              </div>
            </div>
          )}
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
