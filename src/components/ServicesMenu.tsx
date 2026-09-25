import { useState } from 'react';
import { Clock, Sparkles, Calendar, Scissors } from 'lucide-react';
import { Service, ServiceCategory } from '../types/index.ts';
import { formatCurrency } from '../utils/schedule.ts';

interface ServicesMenuProps {
  services: Service[];
  onSelectServiceToBook: (serviceId: string) => void;
}

export function ServicesMenu({ services, onSelectServiceToBook }: ServicesMenuProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | ServiceCategory>('all');

  const filtered = activeCategory === 'all'
    ? services
    : services.filter((s) => s.category === activeCategory);

  return (
    <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-neutral-800/80">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="flex items-center justify-center gap-2 text-xs font-semibold tracking-widest uppercase text-amber-400 mb-2">
          <Scissors className="w-3.5 h-3.5" />
          <span>Cardápio de Cuidados</span>
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight font-display mb-3">
          Nossos Serviços e Rituais
        </h2>
        <p className="text-sm text-neutral-400">
          Técnicas clássicas combinadas com produtos cosméticos masculinos de altíssima qualidade.
        </p>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 bg-neutral-900 border border-neutral-800 rounded-xl max-w-md mx-auto mb-10">
        {(
          [
            { id: 'all', label: 'Todos os Serviços' },
            { id: 'cabelo', label: 'Cabelo' },
            { id: 'barba', label: 'Barba' },
            { id: 'combos', label: 'Combos Especiais' },
            { id: 'especial', label: 'Design & Camuflagem' },
          ] as const
        ).map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeCategory === cat.id
                ? 'bg-amber-500 text-neutral-950 font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((service) => (
          <div
            key={service.id}
            className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 hover:border-amber-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{service.name}</span>
                  {service.popular && (
                    <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Popular
                    </span>
                  )}
                </h3>
              </div>

              <div className="mb-4">
                <span className="text-xl font-bold text-amber-400 tabular-nums">
                  {formatCurrency(service.price)}
                </span>
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed mb-6">
                {service.description}
              </p>
            </div>

            <div className="pt-4 border-t border-neutral-800/80 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-neutral-400">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{service.durationMinutes} minutos</span>
              </span>

              <button
                onClick={() => onSelectServiceToBook(service.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Calendar className="w-3 h-3" />
                <span>Agendar</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
