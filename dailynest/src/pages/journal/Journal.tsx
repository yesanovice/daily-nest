import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useJournalStore } from '../../store/useJournalStore';
import { format } from 'date-fns';
import { Plus, Edit2, Trash2, Smile, Frown, Meh, Save, X, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';

const MOODS = [
  { id: 'great', label: 'Great', icon: Smile, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { id: 'okay', label: 'Okay', icon: Meh, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
  { id: 'bad', label: 'Bad', icon: Frown, color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/20' },
];

function EntryItem({ entry, handleDelete }: { key?: string | number; entry: any; handleDelete: (id: string) => void }) {
  const { updateEntry } = useJournalStore();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(entry.title);
  const [content, setContent] = useState(entry.content);
  const [mood, setMood] = useState(entry.mood);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const moodObj = MOODS.find(m => m.id === (isEditing ? mood : entry.mood)) || MOODS[0];

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    setIsSubmitting(true);
    try {
      await updateEntry(entry.id, { title: title.trim(), content: content.trim(), mood });
      setIsEditing(false);
      toast.success('Journal updated');
    } catch {
      toast.error('Failed to update journal');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditing) {
    return (
      <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[var(--color-surface)] rounded-xl p-6 sm:p-8 border border-[var(--color-divider)] relative overflow-hidden"
      >
        <div className="space-y-6 relative z-10">
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xl font-medium bg-transparent border-0 border-b border-[var(--color-divider-strong)] focus:border-[var(--color-accent)] focus:ring-0 px-0 py-2 outline-none text-[var(--color-primary)] placeholder-[var(--color-tertiary)]"
            autoFocus
            placeholder="Entry Title..."
          />
          <div>
            <div className="flex flex-wrap gap-2">
              {MOODS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setMood(m.id)}
                  className={clsx(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
                    mood === m.id ? m.bg + " " + m.color : "bg-[var(--color-base)] border-[var(--color-divider)] text-[var(--color-tertiary)] hover:text-[var(--color-secondary)] hover:border-[var(--color-divider-strong)]"
                  )}
                >
                  <m.icon size={16} />
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-48 p-4 rounded-xl bg-[var(--color-base)] border border-[var(--color-divider)] focus:border-[var(--color-divider-strong)] focus:ring-0 transition-colors outline-none resize-none text-[var(--color-secondary)] leading-relaxed text-sm placeholder-[var(--color-tertiary)]"
            placeholder="Write your thoughts here..."
          />
          <div className="flex justify-end gap-3 pt-2">
            <button 
               onClick={() => setIsEditing(false)}
               className="px-4 py-2 text-sm font-medium text-[var(--color-tertiary)] hover:text-[var(--color-secondary)] hover:bg-[var(--color-elevated)] rounded-lg transition-colors"
            >
               Cancel
            </button>
            <button 
               onClick={handleSave}
               disabled={!title.trim() || !content.trim() || isSubmitting}
               className="px-4 py-2 text-sm font-medium bg-[var(--color-primary)] text-[var(--color-bg-base)] rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
               Save Changes
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div 
      className="bg-[var(--color-surface)] rounded-xl p-6 sm:p-8 border border-[var(--color-divider)] group relative transition-colors overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-0.5 h-full bg-[var(--color-accent)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <h3 className="text-xl font-medium tracking-tight text-[var(--color-primary)] mb-1">{entry.title}</h3>
          <p className="text-xs font-medium text-[var(--color-tertiary)] uppercase tracking-[0.08em] flex items-center gap-2">
            {format(new Date(entry.date), 'MMM d, yyyy · h:mm a')}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0">
           <div className={clsx("px-2.5 py-1.5 rounded-lg border flex items-center gap-2 font-medium text-xs", moodObj.bg, moodObj.color)}>
              <moodObj.icon size={14} />
              <span className="hidden sm:inline">{moodObj.label}</span>
           </div>
           <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
              <button 
                 onClick={() => setIsEditing(true)}
                 className="text-[var(--color-tertiary)] hover:text-[var(--color-primary)] p-2 hover:bg-[var(--color-elevated)] rounded-lg transition-colors"
              >
                 <Edit2 size={16} />
              </button>
              <button 
                 onClick={() => handleDelete(entry.id)}
                 className="text-[var(--color-tertiary)] hover:text-[var(--color-danger)] p-2 hover:bg-[var(--color-elevated)] rounded-lg transition-colors"
              >
                 <Trash2 size={16} />
              </button>
           </div>
        </div>
      </div>
      <div className="text-[14px] text-[var(--color-secondary)] whitespace-pre-wrap leading-relaxed">
        {entry.content}
      </div>
    </div>
  );
}

export default function Journal() {
  const { entries, subscribeToEntries, addEntry, deleteEntry } = useJournalStore();
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('great');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsub = subscribeToEntries();
    return () => unsub();
  }, [subscribeToEntries]);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    setIsSubmitting(true);
    try {
      await addEntry(title.trim(), content.trim(), mood, new Date().toISOString());
      toast.success('Journal entry saved!');
      setTitle('');
      setContent('');
      setMood('great');
      setIsAdding(false);
    } catch (e) {
      toast.error('Failed to save entry.');
    }
    setIsSubmitting(false);
  };

  const handleDelete = (id: string) => {
    deleteEntry(id).then(() => toast.success('Deleted entry')).catch(() => toast.error('Failed to delete'));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pt-4 max-w-3xl mx-auto">
      <Helmet>
        <title>Journal | DailyNest</title>
      </Helmet>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 relative z-10">
        <div>
          <div className="flex items-center gap-3">
             <BookOpen size={20} className="text-[var(--color-tertiary)]" />
             <h1 className="text-[28px] font-medium text-[var(--color-primary)] tracking-tight">Journal</h1>
          </div>
          <p className="mt-1 text-[13px] text-[var(--color-tertiary)] max-w-xl">A safe space for your thoughts, reflections, and finding clarity.</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="group inline-flex items-center justify-center gap-2 bg-[var(--color-primary)] text-[var(--color-bg-base)] px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity active:scale-95"
          >
            <Plus size={16} />
            <span>New Reflection</span>
          </button>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            className="overflow-hidden relative z-20"
          >
            <div className="bg-[var(--color-surface)] p-6 sm:p-8 rounded-xl border border-[var(--color-divider)] space-y-6 mb-8 relative">
              <div className="flex justify-between items-center relative z-10">
                <h3 className="section-label">Pen Your Thoughts</h3>
                <button onClick={() => setIsAdding(false)} className="text-[var(--color-tertiary)] hover:bg-[var(--color-elevated)] hover:text-[var(--color-primary)] p-2 rounded-lg transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="relative z-10">
                <input 
                  type="text" 
                  placeholder="What's on your mind?" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-2xl font-medium bg-transparent border-0 border-b border-[var(--color-divider)] focus:border-[var(--color-divider-strong)] focus:ring-0 px-0 py-3 placeholder-[var(--color-tertiary)] transition-colors outline-none text-[var(--color-primary)]"
                />
              </div>

              <div className="relative z-10">
                <label className="text-[11px] font-medium text-[var(--color-tertiary)] uppercase tracking-[0.08em] block mb-3">Mood</label>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setMood(m.id)}
                      className={clsx(
                        "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors border",
                        mood === m.id ? m.bg + " " + m.color + " border-transparent" : "bg-[var(--color-base)] border-[var(--color-divider)] text-[var(--color-tertiary)] hover:border-[var(--color-divider-strong)] hover:text-[var(--color-secondary)]"
                      )}
                    >
                      <m.icon size={18} />
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-64 relative z-10">
                <textarea
                   value={content}
                   onChange={(e) => setContent(e.target.value)}
                   className="w-full h-full p-6 rounded-xl bg-[var(--color-base)] border border-[var(--color-divider)] focus:border-[var(--color-divider-strong)] focus:ring-0 transition-colors outline-none resize-none text-[var(--color-secondary)] leading-relaxed text-[14px] placeholder-[var(--color-tertiary)]"
                   placeholder="Start writing..."
                />
              </div>

              <div className="flex justify-end pt-2 relative z-10">
                <button 
                  onClick={handleSubmit}
                  disabled={isSubmitting || !title.trim() || !content.trim()}
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-[var(--color-primary)] text-[var(--color-bg-base)] px-6 py-2.5 rounded-lg font-medium shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Save size={18} />
                  {isSubmitting ? 'Saving...' : 'Save Creation'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6 relative z-10">
        {entries.length === 0 && !isAdding ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl flex flex-col items-center justify-center"
          >
             <BookOpen size={24} className="text-[var(--color-tertiary)] mb-4" />
             <h3 className="text-[14px] font-medium text-[var(--color-primary)] tracking-tight">Your journal is waiting</h3>
             <p className="text-[13px] text-[var(--color-secondary)] mt-2 max-w-sm mx-auto">Document your journey, clear your mind, and build a beautiful archive of your life.</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {entries.map((entry: any) => (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                transition={{ duration: 0.2 }}
              >
                <EntryItem entry={entry} handleDelete={handleDelete} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

