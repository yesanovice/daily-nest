import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useTaskStore } from '../../store/useTaskStore';
import { useHabitStore } from '../../store/useHabitStore';
import { CheckSquare, Flame, Award, TrendingUp, Circle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import clsx from 'clsx';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { tasks, subscribeToTasks, updateTaskStatus } = useTaskStore();
  const { habits, logs, subscribeToHabits, subscribeToLogs } = useHabitStore();

  useEffect(() => {
    const unsubTasks = subscribeToTasks();
    const unsubHabits = subscribeToHabits();
    const unsubLogs = subscribeToLogs();
    return () => {
      unsubTasks();
      unsubHabits();
      unsubLogs();
    };
  }, [subscribeToTasks, subscribeToHabits, subscribeToLogs]);

  const last7Days = (() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      
      const tasksThatDay = tasks.filter(t => {
        const taskDate = t.updatedAt ? new Date(t.updatedAt) : new Date(t.createdAt);
        return taskDate >= startOfDay && taskDate <= endOfDay;
      });

      const completed = tasksThatDay.filter(t => t.status === 'completed').length;
      const total = tasksThatDay.length;
      
      days.push({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        completion: total === 0 ? 0 : Math.round((completed / total) * 100),
      });
    }
    return days;
  })();

  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const highPriorityCount = activeTasks.filter(t => t.priority === 'high').length;

  const todayStr = new Date().toLocaleDateString('en-CA'); // e.g. YYYY-MM-DD local
  const habitsDoneToday = logs.filter(l => l.date === todayStr).length;

  const totalCompletedTasks = tasks.filter(t => t.status === 'completed').length;
  const currLevel = Math.floor(totalCompletedTasks / 5) + 1;
  const scoreMsg = totalCompletedTasks === 0 ? "Just getting started!" : `${totalCompletedTasks} tasks completed!`;

  const toggleTask = (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'todo' : 'completed';
    updateTaskStatus(taskId, newStatus as any).catch(console.error);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <Helmet>
         <title>Dashboard | DailyNest</title>
      </Helmet>

      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-[28px] font-medium text-[var(--color-primary)] tracking-tight">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.displayName?.split(' ')[0] || 'there'}!
        </h1>
        <p className="mt-1 text-[13px] text-[var(--color-tertiary)]">
          Let's make today productive and purposeful.
        </p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Tasks Card */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl p-6 relative transition-colors">
           <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-[var(--color-accent)] rounded-l-xl" />
           <div className="flex items-start justify-between mb-4">
              <span className="text-[32px] font-medium text-[var(--color-primary)] tabular-nums leading-none">{activeTasks.length}</span>
              <CheckSquare size={16} className="text-[var(--color-tertiary)]" strokeWidth={2} />
           </div>
           <div>
             <p className="section-label mb-1">Tasks Remaining</p>
             <p className="text-[13px] text-[var(--color-secondary)]">{highPriorityCount} high priority</p>
           </div>
        </div>

        {/* Habits Card */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl p-6 transition-colors">
           <div className="flex items-start justify-between mb-4">
              <span className="text-[32px] font-medium text-[var(--color-primary)] tabular-nums leading-none">{habits.length > 0 ? habitsDoneToday : "--"}</span>
              <Flame size={16} className="text-[var(--color-tertiary)]" strokeWidth={2} />
           </div>
           <div>
             <p className="section-label mb-1">Habits Done Today</p>
             <p className="text-[13px] text-[var(--color-secondary)]">{habits.length} habits tracked</p>
           </div>
        </div>

        {/* Level Card */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl p-6 transition-colors">
           <div className="flex items-start justify-between mb-4">
              <span className="text-[32px] font-medium text-[var(--color-primary)] tabular-nums leading-none">Lvl {currLevel}</span>
              <Award size={16} className="text-[var(--color-tertiary)]" strokeWidth={2} />
           </div>
           <div>
             <p className="section-label mb-1">Productivity Score</p>
             <p className="text-[13px] text-[var(--color-secondary)]">{scoreMsg}</p>
           </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Today's Focus */}
         <div className="bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-divider)] h-[300px] sm:h-[380px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
               <h3 className="section-label">Today's Focus</h3>
               <Link to="/tasks" className="text-[13px] text-[var(--color-tertiary)] hover:text-[var(--color-secondary)] hover:underline underline-offset-4 transition-colors">
                 View All
               </Link>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
               {tasks.length === 0 ? (
                 <div className="text-center py-12 px-4 h-full flex flex-col items-center justify-center">
                   <CheckSquare size={20} className="text-[var(--color-tertiary)] mb-3" />
                   <p className="text-[14px] font-medium text-[var(--color-secondary)] mb-1">You have a clear slate today.</p>
                   <Link to="/tasks" className="text-[13px] text-[var(--color-accent)] hover:underline underline-offset-4">Add a task</Link>
                 </div>
               ) : (
                 tasks.slice(0, 5).map((task) => (
                   <div key={task.id} className={clsx(
                     "flex items-center gap-4 p-4 rounded-[10px] border transition-colors",
                     task.status === 'completed' 
                        ? "bg-[var(--color-base)] border-[var(--color-divider)] opacity-60" 
                        : "bg-[var(--color-surface)] border-[var(--color-divider)] hover:border-[var(--color-divider-strong)]"
                   )}>
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
                         <h4 className={clsx("text-[14px] truncate", task.status === 'completed' ? "text-[var(--color-tertiary)] line-through" : "text-[var(--color-secondary)]")}>
                           {task.title}
                         </h4>
                      </div>
                      {task.priority === 'high' && task.status !== 'completed' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-danger)] shrink-0" />
                      )}
                   </div>
                 ))
               )}
            </div>
         </div>

         {/* Weekly Progress */}
         <div className="bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-divider)] h-[300px] sm:h-[380px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
               <h3 className="section-label">Weekly Progress</h3>
            </div>
            <div className="flex-1 flex items-end justify-between gap-4 mt-2 pb-1 border-b border-[var(--color-divider)] relative min-h-0">
               {last7Days.map((day, i) => (
                  <div key={i} className="w-full relative h-full flex items-end group">
                     {/* Using accent-subtle as the base bar bg instead of drawing a full border, keeps it minimal */}
                     <div className="w-full bg-[var(--color-elevated)] rounded-t-[4px] relative" style={{ height: '100%' }}>
                        <motion.div 
                           initial={{ height: 0 }}
                           animate={{ height: day.completion === 0 ? '4px' : `${day.completion}%` }}
                           transition={{ duration: 1, type: "spring", bounce: 0.3 }}
                           className="w-full bg-[var(--color-accent)] rounded-t-[4px] bottom-0 absolute"
                        />
                     </div>
                  </div>
               ))}
            </div>
            <div className="flex justify-between mt-3 shrink-0">
               {last7Days.map((day, i) => (
                 <span key={i} className="w-full text-center text-[11px] text-[var(--color-tertiary)] tabular-nums">{day.name.charAt(0)}</span>
               ))}
            </div>
         </div>
      </motion.div>
    </motion.div>
  );
}
