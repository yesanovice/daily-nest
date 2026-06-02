import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Flame, Check, X, Repeat, Edit2, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { useHabitStore } from '../../store/useHabitStore';
import { format } from 'date-fns';
import clsx from 'clsx';

const HABIT_COLORS = [
  'bg-indigo-500', 
  'bg-emerald-500', 
  'bg-amber-500', 
  'bg-rose-500', 
  'bg-cyan-500', 
  'bg-fuchsia-500'
];

export default function Habits() {
  const { habits, logs, isLoading, subscribeToHabits, subscribeToLogs, deleteHabit, toggleHabitLog, getStreak } = useHabitStore();
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const unsubHabits = subscribeToHabits();
    const unsubLogs = subscribeToLogs();
    return () => {
      unsubHabits();
      unsubLogs();
    };
  }, [subscribeToHabits, subscribeToLogs]);

  const handleDelete = (id: string) => {
    deleteHabit(id)
      .then(() => toast.success('Habit deleted'))
      .catch(() => toast.error('Failed to delete habit'));
  };

  const handleToggle = (id: string, isDoneToday: boolean) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    toggleHabitLog(id, today).then(() => {
        if (!isDoneToday) {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Habit Complete', { body: 'Well done on completing your habit!' });
            }
            toast('Habit complete! Well done.', { icon: '🔥' });
        }
    }).catch(() => toast.error('Failed to update habit log'));
  };

  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pt-4">
      <Helmet>
        <title>Habits | DailyNest</title>
      </Helmet>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-[28px] font-medium text-[var(--color-primary)] tracking-tight">Habits</h1>
          <p className="mt-1 text-[13px] text-[var(--color-tertiary)]">Build good routines.</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-[var(--color-bg-base)] px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity active:scale-95"
          >
            <Plus size={16} />
            <span>New Habit</span>
          </button>
        )}
      </motion.div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            className="overflow-hidden"
          >
            <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-divider)] mb-6">
              <NewHabitForm onClose={() => setIsAdding(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--color-accent)]"></div>
        </div>
      ) : habits.length === 0 && !isAdding ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl flex flex-col items-center justify-center"
        >
          <Target size={24} className="text-[var(--color-tertiary)] mb-4" />
          <h3 className="text-[14px] font-medium text-[var(--color-primary)] tracking-tight">No habits yet</h3>
          <p className="text-[13px] text-[var(--color-secondary)] mt-1 max-w-sm mx-auto">
            Start small. Add a new habit to track your daily progress and build a powerful routine.
          </p>
          <button 
            onClick={() => setIsAdding(true)}
            className="mt-6 text-[var(--color-bg-base)] bg-[var(--color-primary)] px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity active:scale-95"
          >
            Create Your First Habit
          </button>
        </motion.div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {habits.map((habit) => (
              <HabitItem 
                key={habit.id}
                habit={habit}
                handleDelete={handleDelete}
                handleToggle={handleToggle}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

function HabitItem({ habit, handleDelete, handleToggle }: { key?: string | number; habit: any; handleDelete: (id: string) => void; handleToggle: (id: string, isDoneToday: boolean) => void }) {
  const { logs, getStreak, updateHabit } = useHabitStore();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(habit.title);
  const [color, setColor] = useState(habit.color || HABIT_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const streak = getStreak(habit.id);
  const today = format(new Date(), 'yyyy-MM-dd');
  const isDoneToday = logs.some(l => l.habitId === habit.id && l.date === today);

  const handleSave = async () => {
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      await updateHabit(habit.id, { title: title.trim(), color });
      setIsEditing(false);
      toast.success('Habit updated');
    } catch {
      toast.error('Failed to update habit');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditing) {
    return (
      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="rounded-[10px] p-5 border bg-[var(--color-surface)] border-[var(--color-divider)] flex flex-col justify-between overflow-hidden"
      >
        <div className="space-y-4">
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-lg font-medium bg-transparent border-0 border-b border-[var(--color-divider)] focus:border-[var(--color-divider-strong)] focus:ring-0 px-0 py-2 outline-none text-[var(--color-primary)] transition-colors"
            autoFocus
          />
          <div className="flex gap-2 justify-center py-2">
            {HABIT_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={clsx(
                  "w-6 h-6 rounded-full transition-transform flex items-center justify-center", 
                  c,
                  color === c ? "ring-2 ring-offset-2 ring-offset-[var(--color-surface)] ring-[var(--color-primary)] scale-110" : "hover:scale-110"
                )}
              >
                {color === c && <Check size={12} className="text-white" />}
              </button>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <button 
               onClick={() => setIsEditing(false)}
               className="flex-1 py-2 text-sm font-medium text-[var(--color-tertiary)] hover:bg-[var(--color-elevated)] hover:text-[var(--color-secondary)] rounded-lg transition-colors"
            >
               Cancel
            </button>
            <button 
               onClick={handleSave}
               disabled={!title.trim() || isSubmitting}
               className="flex-1 py-2 text-sm font-medium bg-[var(--color-primary)] text-[var(--color-bg-base)] rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
               Save
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={clsx(
        "rounded-[10px] p-5 border flex flex-col justify-between group relative overflow-hidden transition-colors duration-300",
        isDoneToday ? "bg-[var(--color-base)] border-[var(--color-divider)] opacity-80" : "bg-[var(--color-surface)] border-[var(--color-divider)] hover:border-[var(--color-divider-strong)]"
      )}
    >
      <div className="flex justify-between items-start mb-6 z-10 relative">
        <div className={clsx("p-2.5 rounded-lg text-white transition-opacity", isDoneToday ? "opacity-30 grayscale" : "", habit.color || HABIT_COLORS[0])}>
          <Repeat size={18} />
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity outline-none">
          <button 
            onClick={() => setIsEditing(true)}
            className="text-[var(--color-tertiary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-elevated)] p-1.5 rounded-md transition-colors outline-none"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => handleDelete(habit.id)}
            className="text-[var(--color-tertiary)] hover:text-[var(--color-danger)] hover:bg-[var(--color-elevated)] p-1.5 rounded-md transition-colors outline-none"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      
      <div className="z-10 relative">
        <h3 className={clsx("text-base font-medium tracking-tight mb-1", isDoneToday ? "text-tertiary" : "text-primary")}>
          {habit.title}
        </h3>
        <div className={clsx("flex items-center gap-1.5 text-xs font-medium mb-5", streak > 0 ? "text-warning" : "text-tertiary")}>
          <Flame size={14} className={clsx(streak > 0 ? "text-warning" : "text-tertiary")} fill={streak > 0 ? "currentColor" : "none"} />
          {streak} day streak
        </div>
        
        <div className="flex gap-2">
          <button 
             onClick={() => handleToggle(habit.id, isDoneToday)}
             className={clsx(
            "flex-1 py-1.5 px-3 rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition-opacity active:scale-95",
            isDoneToday 
              ? "bg-[var(--color-elevated)] text-[var(--color-tertiary)] hover:text-[var(--color-secondary)]" 
              : `${habit.color || HABIT_COLORS[0]} text-white hover:opacity-90`
          )}>
            {isDoneToday ? (
               <>
                  <X size={14} strokeWidth={2.5}/>
                  Undo
               </>
            ) : (
               <>
                  <Check size={14} strokeWidth={2.5}/>
                  Done
               </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function NewHabitForm({ onClose }: { onClose: () => void }) {
  const { addHabit } = useHabitStore();
  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState<any>('daily');
  const [color, setColor] = useState(HABIT_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      await addHabit(title.trim(), frequency, color);
      toast.success('Habit created');
      onClose();
    } catch (err) {
      toast.error('Failed to create habit');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
         <input 
            type="text" 
            placeholder="e.g. Read 30 pages" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xl font-medium bg-transparent border-0 border-b border-[var(--color-divider)] focus:border-[var(--color-divider-strong)] focus:ring-0 px-0 py-2 placeholder-[var(--color-tertiary)] outline-none text-primary transition-colors"
            autoFocus
         />
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        <div className="space-y-3 flex-1">
          <label className="text-[11px] font-medium text-[var(--color-tertiary)] uppercase tracking-[0.08em] block">Frequency</label>
          <div className="flex gap-2">
             <button
               type="button"
               onClick={() => setFrequency('daily')}
               className={clsx("flex-1 py-1.5 rounded-lg font-medium text-sm transition-colors border", frequency === 'daily' ? "bg-[var(--color-elevated)] border-[var(--color-divider-strong)] text-[var(--color-primary)]" : "bg-transparent border-[var(--color-divider)] text-[var(--color-secondary)] hover:border-[var(--color-divider-strong)]")}
             >
               Daily
             </button>
             <button
               type="button"
               onClick={() => setFrequency('weekly')}
               className={clsx("flex-1 py-1.5 rounded-lg font-medium text-sm transition-colors border", frequency === 'weekly' ? "bg-[var(--color-elevated)] border-[var(--color-divider-strong)] text-[var(--color-primary)]" : "bg-transparent border-[var(--color-divider)] text-[var(--color-secondary)] hover:border-[var(--color-divider-strong)]")}
             >
               Weekly
             </button>
          </div>
        </div>

        <div className="space-y-3 flex-1">
          <label className="text-[11px] font-medium text-[var(--color-tertiary)] uppercase tracking-[0.08em] block">Color Theme</label>
          <div className="flex gap-2">
            {HABIT_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={clsx(
                  "w-8 h-8 rounded-full transition-transform flex items-center justify-center", 
                  c,
                  color === c ? "ring-2 ring-offset-2 ring-offset-[var(--color-surface)] ring-[var(--color-primary)] scale-110" : "hover:scale-110"
                )}
              >
                {color === c && <Check size={14} className="text-white" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-divider)]">
         <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--color-tertiary)] hover:text-[var(--color-secondary)] hover:bg-[var(--color-elevated)] rounded-lg transition-colors"
         >
            Cancel
         </button>
         <button 
            type="submit" 
            disabled={!title.trim() || isSubmitting}
            className="px-4 py-2 text-sm font-medium bg-[var(--color-primary)] text-[var(--color-bg-base)] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
         >
            {isSubmitting ? 'Creating...' : 'Create Habit'}
         </button>
      </div>
    </form>
  );
}
