import { Scissors, MapPin, Phone, Clock, Instagram } from 'lucide-react';

interface FooterProps {
  onOpenSupabaseModal: () => void;
}

export function Footer({ onOpenSupabaseModal }: FooterProps) {
  return (
    <footer className="border-t border-neutral-800/80 bg-neutral-950 py-12 text-xs text-neutral-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Scissors className="w-4 h-4 -rotate-45" />
              </div>
              <span className="font-brand font-bold text-sm tracking-wider text-white">
                NAVALHA IMPERIAL
              </span>
            </div>
            <p className="text-neutral-400 leading-relaxed">
              Tradição da barbearia clássica combinada com tecnologia moderna de agendamento e atendimento personalizado.
            </p>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <span className="font-semibold text-white uppercase tracking-wider text-[11px] block">
              Endereço
            </span>
            <div className="flex items-start gap-2 text-neutral-300">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>Av. Paulista, 1000 - Jardins, São Paulo - SP</span>
            </div>
            <p className="text-neutral-500 text-[11px] pl-6">
              Estacionamento conveniado no local
            </p>
          </div>

          {/* Hours */}
          <div className="space-y-2">
            <span className="font-semibold text-white uppercase tracking-wider text-[11px] block">
              Horários de Atendimento
            </span>
            <div className="flex items-start gap-2 text-neutral-300">
              <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div>Segunda a Sexta: 09:00 às 20:00</div>
                <div>Sábado: 09:00 às 19:00</div>
                <div className="text-neutral-500 text-[11px]">Domingos e feriados: Fechado</div>
              </div>
            </div>
          </div>

          {/* Contact & Database */}
          <div className="space-y-2">
            <span className="font-semibold text-white uppercase tracking-wider text-[11px] block">
              Contato & Sistema
            </span>
            <div className="flex items-center gap-2 text-neutral-300">
              <Phone className="w-4 h-4 text-amber-400" />
              <span>(11) 99999-9999</span>
            </div>
            <div className="pt-2">
              <button
                onClick={onOpenSupabaseModal}
                className="text-amber-400 hover:text-amber-300 underline underline-offset-4 cursor-pointer"
              >
                Gerenciar Conexão com Supabase
              </button>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-neutral-500">
          <span>
            © {new Date().getFullYear()} Navalha Imperial Barbearia. Todos os direitos reservados.
          </span>
          <div className="flex items-center gap-4">
            <span>Desenvolvido com integração Supabase</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
