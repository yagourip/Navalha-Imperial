import { Calendar, Award, Clock, ArrowDown } from 'lucide-react';
import { HERO_IMAGE } from '../data/initialData.ts';

interface HeroSectionProps {
  onStartBooking: () => void;
  onExploreBarbers: () => void;
}

export function HeroSection({ onStartBooking, onExploreBarbers }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden border-b border-neutral-800/80 bg-neutral-950">
      {/* Background with measured contrast scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src={HERO_IMAGE}
          alt="Interior sofisticado da Barbearia Navalha Imperial"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-30 filter grayscale-[20%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/90 to-neutral-950/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-neutral-950/70" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28">
        <div className="max-w-2xl">
          {/* Quiet unboxed text kicker */}
          <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-amber-400 mb-4">
            <span>Barbearia & Barbearia Clássica</span>
            <span aria-hidden="true">·</span>
            <span>Desde 2014</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-[1.1] font-display">
            Seu estilo esculpido com <span className="text-amber-400">precisão</span> e respeito ao seu tempo.
          </h1>

          <p className="text-base sm:text-lg text-neutral-300 leading-relaxed mb-8 max-w-xl">
            Escolha o profissional de sua preferência, selecione o serviço e garanta seu horário em segundos.
            Sem filas, com toalha quente, navalha afiada e cerveja gelada.
          </p>

          {/* Clean unboxed proof points */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-neutral-400 mb-10">
            <span className="flex items-center gap-1.5 text-neutral-300">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Pontualidade garantida
            </span>
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span className="flex items-center gap-1.5 text-neutral-300">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              Profissionais especialistas
            </span>
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span className="text-neutral-300">
              Estacionamento cortesia
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={onStartBooking}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Agendar Agora</span>
              <ArrowDown className="w-4 h-4 ml-1" />
            </button>
            <button
              onClick={onExploreBarbers}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 hover:border-neutral-700 font-semibold text-sm transition-all cursor-pointer"
            >
              Conhecer Nossos Barbeiros
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
