"use client";

import React, { useEffect, useState } from 'react';
import { memoryStore } from '@/lib/store/memoryStore';
import { RelationshipEvent } from '@/lib/types/database';
import { formatRomanticDate } from '@/lib/utils/date';
import { WashiTape } from '@/components/decorative/WashiTape';
import { Plus, Heart, Coffee, Umbrella, Plane, Home, X } from 'lucide-react';

export default function OurStoryPage() {
  const [events, setEvents] = useState<RelationshipEvent[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Event Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState<RelationshipEvent['event_type']>('milestone');

  const loadEvents = () => {
    setEvents(memoryStore.getRelationshipEvents());
  };

  useEffect(() => {
    loadEvents();
    const unsubscribe = memoryStore.subscribe(() => {
      loadEvents();
    });
    return () => unsubscribe();
  }, []);

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const coupleId = memoryStore.getCouple()?.id || 'world-1';
    memoryStore.addRelationshipEvent({
      couple_id: coupleId,
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      event_date: newDate,
      event_type: newType,
      icon: newType === 'first_met' ? 'umbrella' : newType === 'first_date' ? 'coffee' : newType === 'trip' ? 'plane' : 'heart',
    });

    setNewTitle('');
    setNewDescription('');
    setShowAddModal(false);
    loadEvents();
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'first_met':
        return <Umbrella className="w-4 h-4 text-brand-rose" />;
      case 'first_date':
        return <Coffee className="w-4 h-4 text-amber-700" />;
      case 'trip':
        return <Plane className="w-4 h-4 text-sky-600" />;
      case 'home':
        return <Home className="w-4 h-4 text-emerald-700" />;
      default:
        return <Heart className="w-4 h-4 text-brand-rose fill-brand-rose" />;
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-brand-rose/20 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-section text-3xl sm:text-5xl font-bold text-brand-dark tracking-tight">
              Our Story
            </h1>
            <span className="text-2xl text-brand-rose">♡</span>
          </div>
          <p className="font-body text-xs sm:text-sm text-brand-warm-gray mt-1">
            The chronological ribbon of every chapter you have written together
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-rose hover:bg-brand-rose-deep text-white font-button font-bold text-xs sm:text-sm shadow-xs transition-all hover:scale-102 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ add a chapter</span>
        </button>
      </div>

      {/* Vertical Ribbon Timeline or Clean Empty State */}
      {events.length > 0 ? (
        <div className="relative pt-6">
          <div
            className="absolute top-0 bottom-0 left-6 sm:left-1/2 -translate-x-1/2 w-1.5 bg-brand-soft-pink border-x border-brand-rose/30"
            aria-hidden="true"
          />

          <div className="space-y-10 sm:space-y-12">
            {events.map((event, index) => {
              const isEven = index % 2 === 0;

              return (
                <div
                  key={event.id}
                  className={`relative flex flex-col sm:flex-row items-start sm:items-center ${
                    isEven ? 'sm:flex-row-reverse' : ''
                  }`}
                >
                  {/* Timeline Center Pin */}
                  <div className="absolute left-6 sm:left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white border-2 border-brand-rose flex items-center justify-center shadow-xs z-20">
                    {getEventIcon(event.event_type)}
                  </div>

                  {/* Content Card */}
                  <div className="ml-14 sm:ml-0 sm:w-1/2 px-2 sm:px-8">
                    <div className="relative">
                      <div className="absolute -top-3.5 left-4 z-10 pointer-events-none">
                        <WashiTape
                          styleName={index % 2 === 0 ? 'washi-pink' : 'washi-lavender'}
                          className="w-24"
                          angle={isEven ? 2 : -2}
                        />
                      </div>

                      <div className="paper-sheet rounded-3xl p-5 sm:p-6 border-2 border-brand-rose/25 shadow-xs bg-white/95">
                        <span className="font-button text-[11px] font-bold text-brand-rose-deep uppercase tracking-wider block mb-1">
                          {formatRomanticDate(event.event_date)} ✦
                        </span>

                        <h3 className="font-section text-xl sm:text-2xl font-bold text-brand-dark leading-snug">
                          {event.title}
                        </h3>

                        {event.description && (
                          <p className="font-body text-xs sm:text-sm text-brand-dark/80 mt-2 leading-relaxed">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="paper-ruled rounded-3xl p-10 sm:p-14 text-center max-w-lg mx-auto my-12 border-2 border-brand-rose/25 shadow-xs bg-white/95">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-soft-pink flex items-center justify-center border border-brand-rose/30 mb-4">
            <Heart className="w-7 h-7 text-brand-rose fill-brand-rose" />
          </div>
          <h3 className="font-section text-2xl sm:text-3xl font-bold text-brand-dark mb-1">
            Your story begins today ♡
          </h3>
          <p className="font-body text-xs sm:text-sm text-brand-warm-gray max-w-sm mx-auto mb-6 leading-relaxed">
            Record the day you met, your first date, or your special milestones. Watch your story timeline bloom over the years.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand-rose hover:bg-brand-rose-deep text-white font-button font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add your first chapter</span>
          </button>
        </div>
      )}

      {/* Add Chapter Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="paper-sheet rounded-3xl p-6 sm:p-8 max-w-md w-full border-2 border-brand-rose/30 shadow-xl relative animate-in fade-in zoom-in-95 bg-white">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-brand-soft-pink text-brand-warm-gray"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-6">
              <h3 className="font-section text-2xl sm:text-3xl font-bold text-brand-dark">
                Add a new chapter ♡
              </h3>
              <p className="font-body text-xs text-brand-warm-gray mt-1">
                Pin a milestone to your couple story timeline
              </p>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="block font-section text-xs font-semibold text-brand-dark mb-1.5">
                  Chapter Headline
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. First time holding paws"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-brand-cream-subtle border border-brand-dark/15 rounded-2xl px-3.5 py-2 font-section text-sm text-brand-dark focus:ring-2 focus:ring-brand-rose/40"
                />
              </div>

              <div>
                <label className="block font-section text-xs font-semibold text-brand-dark mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-brand-cream-subtle border border-brand-dark/15 rounded-2xl px-3.5 py-2 font-body text-xs text-brand-dark focus:ring-2 focus:ring-brand-rose/40"
                />
              </div>

              <div>
                <label className="block font-section text-xs font-semibold text-brand-dark mb-1.5">
                  Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'first_met', label: '🌧️ First Met' },
                    { id: 'first_date', label: '☕ First Date' },
                    { id: 'milestone', label: '💗 Milestone' },
                    { id: 'trip', label: '✈️ Trip' },
                    { id: 'home', label: '🏠 Moving In' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setNewType(t.id as any)}
                      className={`px-3 py-1.5 rounded-2xl font-button text-xs font-bold transition-all ${
                        newType === t.id
                          ? 'bg-brand-rose text-white shadow-2xs'
                          : 'bg-brand-cream-subtle text-brand-dark border border-brand-rose/25'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-section text-xs font-semibold text-brand-dark mb-1.5">
                  Story Details
                </label>
                <textarea
                  rows={3}
                  placeholder="Where were you? How did it feel?"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-brand-cream-subtle border border-brand-dark/15 rounded-2xl p-3 font-body text-xs text-brand-dark resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-brand-rose hover:bg-brand-rose-deep text-white font-button font-bold text-xs shadow-xs transition-all mt-2 cursor-pointer"
              >
                Pin chapter to timeline ♡
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
