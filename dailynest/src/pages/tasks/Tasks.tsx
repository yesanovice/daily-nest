import React, { useEffect, useState } from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import { CheckCircle2, Circle, CheckSquare, Plus, Trash2, Calendar as CalendarIcon, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import clsx from 'clsx';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';

export default function Tasks() {
  const { tasks, isLoading, subscribeToTasks, updateTaskStatus, deleteTask } = useTaskStore();
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const unsub = subscribeToTasks();
    return () => unsub();
  }, [subscribeToTasks]);

  const toggleTask = (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'todo' : 'completed';
    updateTaskStatus(taskId, newStatus as any).then(() => {
        if (newStatus === 'completed') {
           if ('Notification' in window && Notification.permission === 'granted') {
             new Notification('Task Complete', { body: 'Well done on completing a task!' });
           }
           toast.success('Task completed! Keep up the good work.');
        }
    }).catch(() => toast.error('Failed to update task'));
  };

  const handleRemove = (taskId: string) => {
    deleteTask(taskId).then(() => toast.success('Task removed')).catch(() => toast.error('Failed to remove task'));
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Tasks | DailyNest</title>
      </Helmet>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-medium text-[var(--color-primary)] tracking-tight">Tasks</h1>
          <p className="mt-1 text-[13px] text-[var(--color-tertiary)]">Manage your daily action items.</p>
        </div>
        {!isAdding && (
          <button 
             onClick={() => setIsAdding(true)}
             className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-[var(--color-bg-base)] px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity active:scale-95"
          >
            <Plus size={16} />
            <span>New Task</span>
          </button>
        )}
      </div>

      {isAdding && (
         <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-divider)] animate-in fade-in slide-in-from-top-4">
            <NewTaskForm onClose={() => setIsAdding(false)} />
         </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--color-accent)]"></div>
        </div>
      ) : tasks.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl flex flex-col items-center justify-center"
        >
          <CheckSquare size={24} className="text-[var(--color-tertiary)] mb-4" />
          <h3 className="text-[14px] font-medium text-[var(--color-primary)] tracking-tight">No tasks yet</h3>
          <p className="text-[13px] text-[var(--color-secondary)] mt-1 max-w-sm mx-auto">Get started by creating your first task for the day.</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {tasks.map(task => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                transition={{ duration: 0.2 }}
              >
                <TaskItem task={task} toggleTask={toggleTask} handleRemove={handleRemove} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function TaskItem({ task, toggleTask, handleRemove }: { key?: string | number; task: any; toggleTask: (id: string, s: string) => void; handleRemove: (id: string) => void }) {
  const { updateTask } = useTaskStore();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState(task.priority);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      await updateTask(task.id, { title: title.trim(), description: description.trim(), priority });
      setIsEditing(false);
      toast.success('Task updated');
    } catch {
      toast.error('Failed to update task');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-divider)] animate-in fade-in">
        <div className="space-y-4">
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-[16px] font-medium bg-transparent border-0 border-b border-[var(--color-divider)] focus:border-[var(--color-divider-strong)] focus:ring-0 px-0 py-2 outline-none text-[var(--color-primary)] placeholder-[var(--color-tertiary)] transition-colors"
            autoFocus
          />
          <input 
            type="text" 
            placeholder="Description (optional)" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-[13px] bg-transparent border-0 border-b border-[var(--color-divider)] focus:border-[var(--color-divider-strong)] focus:ring-0 px-0 py-1.5 outline-none text-[var(--color-secondary)] placeholder-[var(--color-tertiary)] transition-colors"
          />
          <div className="flex items-center justify-between pt-2 mt-4">
             <select 
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="text-[13px] border border-[var(--color-divider)] rounded-lg focus:border-[var(--color-divider-strong)] px-3 py-1.5 bg-[var(--color-base)] text-[var(--color-primary)] font-medium outline-none transition-colors"
             >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
             </select>
             <div className="flex gap-2">
                <button 
                   onClick={() => setIsEditing(false)}
                   className="px-4 py-2 text-[13px] font-medium text-[var(--color-tertiary)] hover:bg-[var(--color-elevated)] hover:text-[var(--color-secondary)] rounded-lg transition-colors"
                >
                   Cancel
                </button>
                <button 
                   onClick={handleSave}
                   disabled={!title.trim() || isSubmitting}
                   className="px-4 py-2 text-[13px] font-medium bg-[var(--color-primary)] text-[var(--color-bg-base)] rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                   Save
                </button>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={clsx(
        "group relative flex items-start sm:items-center gap-4 bg-[var(--color-surface)] p-4 rounded-[10px] border transition-colors",
        task.status === 'completed' ? "border-[var(--color-divider)] opacity-60 bg-[var(--color-base)]" : "border-[var(--color-divider)] hover:border-[var(--color-divider-strong)]"
      )}
    >
      <button 
        onClick={() => toggleTask(task.id, task.status)}
        className="pt-0.5 sm:pt-0 shrink-0 text-[var(--color-tertiary)] hover:text-[var(--color-primary)] transition-colors outline-none"
      >
        {task.status === 'completed' ? <CheckCircle2 size={18} className="text-[var(--color-tertiary)]" /> : <Circle size={18} />}
      </button>
      
      <div className="flex-1 min-w-0">
        <h3 className={clsx("text-[14px] truncate", task.status === 'completed' ? "text-[var(--color-tertiary)] line-through" : "text-[var(--color-secondary)]")}>
          {task.title}
        </h3>
        {task.description && (
          <p className="text-[12px] text-[var(--color-tertiary)] truncate mt-0.5">{task.description}</p>
        )}
        
        <div className="flex items-center gap-3 mt-1.5">
          <span className={clsx(
            "px-2 py-0.5 text-[11px] font-medium tracking-[0.02em] rounded",
            task.priority === 'high' ? "bg-[var(--color-danger)]/10 text-[var(--color-danger)]" : 
            task.priority === 'medium' ? "bg-[var(--color-warning)]/10 text-[var(--color-warning)]" : 
            "bg-[var(--color-elevated)] text-[var(--color-secondary)]"
          )}>
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>
          {task.dueDate && (
             <span className="flex items-center gap-1 text-[var(--color-secondary)] bg-[var(--color-elevated)] px-2 py-0.5 rounded-md text-[11px] font-medium tracking-[0.02em]">
               <CalendarIcon size={12} />
               {format(new Date(task.dueDate), 'MMM d, yyyy')}
             </span>
          )}
        </div>
      </div>
      
      <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex items-center transition-opacity min-w-max outline-none">
        <button 
          onClick={() => setIsEditing(true)}
          className="p-2 text-[var(--color-tertiary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-elevated)] rounded-lg transition-colors outline-none"
        >
          <Edit2 size={16} />
        </button>
        <button 
          onClick={() => handleRemove(task.id)}
          className="p-2 text-[var(--color-tertiary)] hover:text-[var(--color-danger)] hover:bg-[var(--color-elevated)] rounded-lg transition-colors outline-none"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

function NewTaskForm({ onClose }: { onClose: () => void }) {
  const { addTask } = useTaskStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<any>('medium');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      await addTask(title.trim(), priority, dueDate || null, description.trim());
      toast.success('Task created');
      onClose();
    } catch (err) {
      toast.error('Failed to create task');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
         <input 
            type="text" 
            placeholder="What needs to be done?" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-[16px] font-medium bg-transparent border-0 border-b border-[var(--color-divider)] focus:border-[var(--color-divider-strong)] focus:ring-0 px-0 py-2 placeholder-[var(--color-tertiary)] outline-none text-[var(--color-primary)] transition-colors"
            autoFocus
         />
      </div>
      <div>
         <input 
            type="text" 
            placeholder="Add description (optional)" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-[13px] bg-transparent border-0 border-b border-[var(--color-divider)] focus:border-[var(--color-divider-strong)] focus:ring-0 px-0 py-1.5 placeholder-[var(--color-tertiary)] outline-none text-[var(--color-secondary)] transition-colors"
         />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
         <div className="flex gap-2">
           <select 
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="text-[13px] border border-[var(--color-divider)] bg-[var(--color-base)] text-[var(--color-primary)] rounded-lg focus:border-[var(--color-divider-strong)] px-3 py-1.5 font-medium outline-none transition-colors"
           >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
           </select>
           <input
             type="date"
             value={dueDate}
             onChange={(e) => setDueDate(e.target.value)}
             className="text-[13px] border border-[var(--color-divider)] bg-[var(--color-base)] text-[var(--color-primary)] rounded-lg focus:border-[var(--color-divider-strong)] px-3 py-1.5 font-medium outline-none transition-colors min-w-[130px] color-scheme-dark"
             style={{ colorScheme: 'var(--color-scheme)' }}
           />
         </div>
         
         <div className="flex gap-2 justify-end">
            <button 
               type="button" 
               onClick={onClose}
               className="px-4 py-2 text-[13px] font-medium text-[var(--color-tertiary)] hover:text-[var(--color-secondary)] hover:bg-[var(--color-elevated)] rounded-lg transition-colors"
            >
               Cancel
            </button>
            <button 
               type="submit" 
               disabled={!title.trim() || isSubmitting}
               className="px-4 py-2 text-[13px] font-medium bg-[var(--color-primary)] text-[var(--color-bg-base)] rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
               {isSubmitting ? 'Saving...' : 'Save Task'}
            </button>
         </div>
      </div>
    </form>
  );
}
