import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTaskStore } from '../../store/useTaskStore';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { motion } from 'motion/react';
import { CheckCircle2, Circle, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

export default function Calendar() {
  const { tasks, subscribeToTasks, updateTaskStatus } = useTaskStore();
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const unsub = subscribeToTasks();
    return () => unsub();
  }, [subscribeToTasks]);

  const startDate = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  const selectedDateTasks = tasks.filter(task => {
    if (!task.dueDate) return false;
    return isSameDay(new Date(task.dueDate), selectedDate);
  });

  const toggleTask = (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'todo' : 'completed';
    updateTaskStatus(taskId, newStatus as any).catch(console.error);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pt-4">
      <Helmet>
        <title>Calendar | DailyNest</title>
      </Helmet>

      <div>
        <h1 className="text-[28px] font-medium text-[var(--color-primary)] tracking-tight">Calendar</h1>
        <p className="mt-1 text-[13px] text-[var(--color-tertiary)]">Plan your schedule.</p>
      </div>

      <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-divider)]">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[14px] font-medium text-[var(--color-primary)] flex items-center gap-2">
            <CalendarIcon size={16} className="text-[var(--color-secondary)]" />
            {format(selectedDate, 'MMMM yyyy')}
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setSelectedDate(addDays(selectedDate, -7))}
              className="w-8 h-8 flex items-center justify-center border border-[var(--color-divider-strong)] rounded-lg hover:bg-[var(--color-elevated)] text-[var(--color-secondary)] transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={() => setSelectedDate(new Date())}
              className="px-3 py-1.5 border border-[var(--color-divider-strong)] text-[var(--color-secondary)] font-medium rounded-lg hover:bg-[var(--color-elevated)] hover:text-[var(--color-primary)] transition-colors text-[13px]"
            >
              Today
            </button>
            <button 
              onClick={() => setSelectedDate(addDays(selectedDate, 7))}
              className="w-8 h-8 flex items-center justify-center border border-[var(--color-divider-strong)] rounded-lg hover:bg-[var(--color-elevated)] text-[var(--color-secondary)] transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 sm:gap-4">
          {weekDays.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={clsx(
                  "flex flex-col items-center py-3 rounded-lg transition-colors border",
                  isSelected 
                    ? "bg-[var(--color-accent)] text-white border-transparent" 
                    : isToday 
                      ? "bg-[var(--color-elevated)] text-[var(--color-primary)] border-[var(--color-divider-strong)]" 
                      : "bg-transparent text-[var(--color-secondary)] border-transparent hover:bg-[var(--color-elevated)]"
                )}
              >
                <span className={clsx("text-[11px] font-medium uppercase tracking-[0.08em] mb-1", isSelected ? "text-white/80" : "text-[var(--color-tertiary)]")}>
                  {format(day, 'E')}
                </span>
                <span className="text-[16px] font-medium tabular-nums">{format(day, 'd')}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="section-label">
          Tasks for {isSameDay(selectedDate, new Date()) ? 'Today' : format(selectedDate, 'MMM d, yyyy')}
        </h3>
        
        {selectedDateTasks.length === 0 ? (
          <div className="bg-[var(--color-surface)] py-12 rounded-xl text-center flex flex-col items-center justify-center border border-[var(--color-divider)]">
             <CalendarIcon size={20} className="text-[var(--color-tertiary)] mb-3" />
             <p className="text-[14px] font-medium text-[var(--color-secondary)]">No tasks scheduled for this date.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDateTasks.map(task => (
              <motion.div 
                layout
                key={task.id} 
                className={clsx(
                  "flex items-center gap-4 bg-[var(--color-surface)] p-4 rounded-[10px] border transition-colors",
                  task.status === 'completed' ? "border-[var(--color-divider)] opacity-60 bg-[var(--color-base)]" : "border-[var(--color-divider)] hover:border-[var(--color-divider-strong)]"
                )}
              >
                <button 
                  onClick={() => toggleTask(task.id, task.status)}
                  className="shrink-0 text-[var(--color-tertiary)] hover:text-[var(--color-primary)] transition-colors"
                >
                  {task.status === 'completed' ? (
                    <CheckCircle2 size={18} className="text-[var(--color-tertiary)]" />
                  ) : (
                    <Circle size={18} />
                  )}
                </button>
                
                <div className="flex-1 min-w-0">
                  <h3 className={clsx("text-[14px] truncate", task.status === 'completed' ? "text-[var(--color-tertiary)] line-through" : "text-[var(--color-secondary)]")}>
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className={clsx(
                      "px-2 py-0.5 text-[11px] font-medium tracking-[0.02em] rounded",
                      task.priority === 'high' ? "bg-[var(--color-danger)]/10 text-[var(--color-danger)]" : 
                      task.priority === 'medium' ? "bg-[var(--color-warning)]/10 text-[var(--color-warning)]" : 
                      "bg-[var(--color-elevated)] text-[var(--color-secondary)]"
                    )}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
