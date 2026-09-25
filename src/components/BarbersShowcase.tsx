import { Star, Calendar, Scissors, Award } from 'lucide-react';
import { Barber } from '../types/index.ts';

interface BarbersShowcaseProps {
  barbers: Barber[];
  onSelectBarberToBook: (barberId: string) => void;
}

export function BarbersShowcase({ barbers, onSelectBarberToBook }: BarbersShowcaseProps) {
  return (
    <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-neutral-800/80">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="flex items-center justify-center gap-2 text-xs font-semibold tracking-widest uppercase text-amber-400 mb-2">
          <Scissors className="w-3.5 h-3.5" />
          <span>Equipe Especializada</span>
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight font-display mb-3">
          Mestres da Navalha e do Visagismo
        </h2>
        <p className="text-sm text-neutral-400">
          Cada profissional da nossa equipe possui técnicas apuradas, estilo próprio e dedicação absoluta
          ao cuidado masculino.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {barbers.map((barber) => (
          <div
            key={barber.id}
            className="group bg-neutral-900/60 border border-neutral-800/80 rounded-2xl overflow-hidden hover:border-amber-500/50 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Photo */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-950">
                <img
                  src={barber.photoUrl}
                  alt={`Barbeiro ${barber.name}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent" />
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-neutral-950/80 backdrop-blur-sm text-xs font-bold text-amber-400 flex items-center gap-1 border border-neutral-800">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{barber.rating.toFixed(1)}</span>
                  <span className="text-[10px] text-neutral-400 font-normal">
                    ({barber.reviewCount})
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-white mb-1">{barber.name}</h3>
                <p className="text-xs font-semibold text-amber-400 mb-3">{barber.role}</p>
                <p className="text-xs text-neutral-300 leading-relaxed mb-4">{barber.bio}</p>

                {/* Specialties */}
                <div className="space-y-1.5 mb-6">
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
                    Especialidades
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {barber.specialties.map((spec, i) => (
                      <span
                        key={i}
                        className="text-xs text-neutral-300 bg-neutral-800/60 border border-neutral-800 px-2 py-0.5 rounded-md"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-neutral-400 flex items-center gap-1.5 mb-4">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Atendimento: {barber.workingHours.start} às {barber.workingHours.end}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0">
              <button
                onClick={() => onSelectBarberToBook(barber.id)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 text-white text-xs font-bold transition-all cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Agendar com {barber.name.split(' ')[0]}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
