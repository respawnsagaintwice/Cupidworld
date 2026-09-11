"use client";

import React, { useEffect, useState } from 'react';
import { memoryStore } from '@/lib/store/memoryStore';
import { ImportantDate } from '@/lib/types/database';
import { getDaysUntil, formatRomanticDate } from '@/lib/utils/date';
import { WashiTape } from '@/components/decorative/WashiTape';
import { ChevronLeft, ChevronRight, Plus, Heart, X } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, parseISO } from 'date-fns';

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dates, setDates] = useState<ImportantDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<ImportantDate | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Date form state
  const [newTitle, setNewTitle] = useState('');
  const [newDateStr, setNewDateStr] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newType, setNewType] = useState<ImportantDate['type']>('anniversary');
  const [newDescription, setNewDescription] = useState('');

  const loadDates = () => {
    setDates(memoryStore.getImportantDates());
  };

  useEffect(() => {
    loadDates();
    const unsubscribe = memoryStore.subscribe(() => {
      loadDates();
    });
    return () => unsubscribe();
  }, []);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Calendar Grid Generation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const handleAddDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const coupleId = memoryStore.getCouple()?.id || 'world-1';
    memoryStore.addImportantDate({
      couple_id: coupleId,
      title: newTitle.trim(),
      date: newDateStr,
      type: newType,
      description: newDescription.trim() || undefined,
    });

    setNewTitle('');
    setNewDescription('');
    setShowAddModal(false);
    loadDates();
  };

  const getEventForDay = (calendarDay: Date) => {
    const formatted = format(calendarDay, 'yyyy-MM-dd');
    const dayMonth = format(calendarDay, 'MM-dd');

    return dates.find((d) => {
      if (d.date === formatted) return true;
      try {
        const parsed = parseISO(d.date);
        return format(parsed, 'MM-dd') === dayMonth;
      } catch {
        return false;
      }
    });
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-brand-rose/20 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-section text-3xl sm:text-5xl font-bold text-brand-dark tracking-tight">
              Our Little Calendar
            </h1>
            <span className="text-2xl text-brand-rose">🗓️</span>
          </div>
          <p className="font-body text-xs sm:text-sm text-brand-warm-gray mt-1">
            The bedroom wall calendar marking every day that belongs to us
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-rose hover:bg-brand-rose-deep text-white font-button font-bold text-xs sm:text-sm shadow-xs transition-all hover:scale-102 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ add important date</span>
        </button>
      </div>

      {/* Bedroom Wall Calendar Hanging Notebook Container */}
      <div className="max-w-4xl mx-auto relative">
        
        {/* Top Washi Tape Pins */}
        <div className="absolute -top-3.5 left-12 z-20 pointer-events-none">
          <WashiTape styleName="washi-pink" className="w-24" angle={-3} />
        </div>
        <div className="absolute -top-3.5 right-12 z-20 pointer-events-none">
          <WashiTape styleName="washi-yellow" className="w-24" angle={2} />
        </div>

        {/* Calendar Body */}
        <div className="paper-sheet rounded-3xl p-6 sm:p-10 border-2 border-brand-rose/30 shadow-md relative bg-white/95">
          
          {/* Month Header Navigation */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-brand-rose/20">
            <button
              onClick={prevMonth}
              className="p-2 rounded-2xl hover:bg-brand-soft-pink/50 text-brand-dark transition-colors cursor-pointer"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="text-center">
              <h2 className="font-section text-2xl sm:text-4xl font-bold text-brand-dark">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <span className="font-button text-xs text-brand-rose-deep font-bold uppercase tracking-wider block mt-0.5">
                our days together ♡
              </span>
            </div>

            <button
              onClick={nextMonth}
              className="p-2 rounded-2xl hover:bg-brand-soft-pink/50 text-brand-dark transition-colors cursor-pointer"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Weekday Labels (Fredoka) */}
          <div className="grid grid-cols-7 text-center mb-3">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((weekday) => (
              <span
                key={weekday}
                className="font-section text-xs font-semibold text-brand-warm-gray uppercase tracking-wider"
              >
                {weekday}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {days.map((d, index) => {
              const event = getEventForDay(d);
              const inMonth = isSameMonth(d, monthStart);
              const isToday = isSameDay(d, new Date());

              return (
                <div
                  key={index}
                  onClick={() => event && setSelectedDate(event)}
                  className={`min-h-[64px] sm:min-h-[85px] p-1.5 sm:p-2 rounded-2xl border transition-all flex flex-col justify-between ${
                    inMonth ? 'bg-brand-cream-subtle/50 text-brand-dark' : 'bg-transparent text-brand-muted/40'
                  } ${
                    event
                      ? 'border-brand-rose/40 bg-brand-soft-pink/40 hover:bg-brand-soft-pink/60 cursor-pointer shadow-2xs transform hover:-translate-y-0.5'
                      : 'border-transparent'
                  } ${isToday ? 'ring-2 ring-brand-rose ring-offset-1' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-body text-xs font-bold ${
                        isToday ? 'w-5 h-5 rounded-full bg-brand-rose text-white flex items-center justify-center' : ''
                      }`}
                    >
                      {format(d, 'd')}
                    </span>
                    {event && (
                      <span className="text-sm">
                        {event.type === 'anniversary' && '💗'}
                        {event.type === 'birthday' && '🎂'}
                        {event.type === 'trip' && '✈️'}
                        {event.type === 'first_date' && '☕'}
                        {(!['anniversary', 'birthday', 'trip', 'first_date'].includes(event.type)) && '🌸'}
                      </span>
                    )}
                  </div>

                  {event && (
                    <p className="font-section text-xs sm:text-sm font-bold text-brand-rose-deep line-clamp-1 truncate leading-tight">
                      {event.title}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* Date Detail Modal */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="paper-sheet rounded-3xl p-6 sm:p-8 max-w-sm w-full border-2 border-brand-rose/30 shadow-xl relative animate-in fade-in zoom-in-95 bg-white">
            <button
              onClick={() => setSelectedDate(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-brand-soft-pink text-brand-warm-gray"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center pt-2 pb-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-soft-pink flex items-center justify-center text-3xl mb-3 border border-brand-rose/30">
                {selectedDate.type === 'anniversary' && '💗'}
                {selectedDate.type === 'birthday' && '🎂'}
                {selectedDate.type === 'trip' && '✈️'}
                {selectedDate.type === 'first_date' && '☕'}
                {(!['anniversary', 'birthday', 'trip', 'first_date'].includes(selectedDate.type)) && '🌸'}
              </div>

              <h3 className="font-section text-2xl font-bold text-brand-dark mb-1">
                {selectedDate.title}
              </h3>
              <p className="font-body text-xs text-brand-warm-gray font-medium">
                {formatRomanticDate(selectedDate.date)}
              </p>

              <div className="my-4 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-brand-soft-pink text-brand-rose-deep font-button font-bold text-xs">
                <span>{getDaysUntil(selectedDate.date)} days away</span>
                <Heart className="w-3.5 h-3.5 fill-brand-rose-deep" />
              </div>

              {selectedDate.description && (
                <p className="font-body text-xs sm:text-sm text-brand-dark/90 leading-relaxed bg-brand-cream-subtle p-3.5 rounded-2xl border border-brand-dark/10 text-left mt-2">
                  {selectedDate.description}
                </p>
              )}
            </div>

            <button
              onClick={() => setSelectedDate(null)}
              className="w-full py-2.5 rounded-full bg-brand-rose text-white font-button font-bold text-xs hover:bg-brand-rose-deep transition-all"
            >
              Close note ♡
            </button>
          </div>
        </div>
      )}

      {/* Add Date Modal */}
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
                Add an important date ♡
              </h3>
              <p className="font-body text-xs text-brand-warm-gray mt-1">
                Pin an upcoming milestone or sweet anniversary
              </p>
            </div>

            <form onSubmit={handleAddDate} className="space-y-4">
              <div>
                <label className="block font-section text-xs font-semibold text-brand-dark mb-1.5">
                  Occasion Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Our First Anniversary Trip"
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
                  value={newDateStr}
                  onChange={(e) => setNewDateStr(e.target.value)}
                  className="w-full bg-brand-cream-subtle border border-brand-dark/15 rounded-2xl px-3.5 py-2 font-body text-xs text-brand-dark focus:ring-2 focus:ring-brand-rose/40"
                />
              </div>

              <div>
                <label className="block font-section text-xs font-semibold text-brand-dark mb-1.5">
                  Type of Day
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'anniversary', label: '💗 Anniversary' },
                    { id: 'birthday', label: '🎂 Birthday' },
                    { id: 'trip', label: '✈️ Trip' },
                    { id: 'first_date', label: '☕ First Date' },
                    { id: 'special', label: '🌸 Special Day' },
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
                  Description / Memory Note (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Special plans, surprises, restaurant reservation..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-brand-cream-subtle border border-brand-dark/15 rounded-2xl p-3 font-body text-xs text-brand-dark resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-brand-rose hover:bg-brand-rose-deep text-white font-button font-bold text-xs shadow-xs transition-all mt-2 cursor-pointer"
              >
                Pin date to calendar ♡
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
