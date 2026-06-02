import React, { useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { format } from 'date-fns';
import { useTaskStore } from '../../store/useTaskStore';
import { useHabitStore } from '../../store/useHabitStore';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { CheckCircle2, TrendingUp, Target, Flame, Repeat, BarChart3 } from 'lucide-react';

export default function Analytics() {
  const { tasks, subscribeToTasks } = useTaskStore();
  const { habits, logs, subscribeToHabits, subscribeToLogs, getStreak } = useHabitStore();

  useEffect(() => {
    const unsubT = subscribeToTasks();
    const unsubH = subscribeToHabits();
    const unsubL = subscribeToLogs();
    
    return () => {
      unsubT();
      unsubH();
      unsubL();
    };
  }, [subscribeToTasks, subscribeToHabits, subscribeToLogs]);

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const highestStreak = habits.length > 0 ? Math.max(...habits.map(h => getStreak(h.id))) : 0;

  const pieData = [
    { name: 'Completed', value: completedTasks },
    { name: 'Todo', value: tasks.filter(t => t.status === 'todo').length },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length },
  ];

  const priorityData = [
    { name: 'High', value: tasks.filter(t => t.priority === 'high').length, fill: 'var(--color-accent)', opacity: 1 },
    { name: 'Medium', value: tasks.filter(t => t.priority === 'medium').length, fill: 'var(--color-accent)', opacity: 1 },
    { name: 'Low', value: tasks.filter(t => t.priority === 'low').length, fill: 'var(--color-accent)', opacity: 1 },
  ];

  const last7DaysTasks = useMemo(() => {
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
        completed,
        uncompleted: total - completed,
        total,
      });
    }
    return days;
  }, [tasks]);

  const last7DaysHabits = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      
      // Approximation: if the habit was created before or on this day
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      const habitsActiveDay = habits.filter(h => new Date(h.createdAt) <= startOfDay).length;
      
      const completedHabitsDay = logs.filter(l => l.date === dateStr).length;
      
      days.push({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        completion: habitsActiveDay === 0 ? 0 : Math.round((completedHabitsDay / habitsActiveDay) * 100),
        completed: completedHabitsDay,
        uncompleted: habitsActiveDay - completedHabitsDay,
        total: habitsActiveDay,
      });
    }
    return days;
  }, [habits, logs]);

  const topStreaks = useMemo(() => {
    return habits
      .map(h => ({
        name: h.title,
        streak: getStreak(h.id),
      }))
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 5); // top 5
  }, [habits, getStreak]);

  const hasAnyTaskData = tasks.length > 0;
  const hasAnyHabitData = habits.length > 0;

  const CustomTooltipTasks = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[var(--color-elevated)] border border-[var(--color-divider)] p-3 rounded-lg shadow-sm">
          <p className="text-[13px] font-medium text-[var(--color-primary)] mb-1">{label}</p>
          <p className="text-[12px] text-[var(--color-secondary)] mb-1">{data.completed} of {data.total} tasks completed</p>
          <p className="text-[14px] font-semibold text-[var(--color-accent)]">{data.completion}%</p>
        </div>
      );
    }
    return null;
  };

  const CustomTooltipHabits = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[var(--color-elevated)] border border-[var(--color-divider)] p-3 rounded-lg shadow-sm">
          <p className="text-[13px] font-medium text-[var(--color-primary)] mb-1">{label}</p>
          <p className="text-[12px] text-[var(--color-secondary)] mb-1">{data.completed} of {data.total} habits completed</p>
          <p className="text-[14px] font-semibold text-[var(--color-success)]">{data.completion}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pt-4">
      <Helmet>
        <title>Analytics | DailyNest</title>
      </Helmet>

      <div>
        <h1 className="text-[28px] font-medium text-[var(--color-primary)] tracking-tight">Analytics</h1>
        <p className="mt-1 text-[13px] text-[var(--color-tertiary)]">Understand your productivity trends.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Completion Rate', value: `${completionRate}%`, icon: Target },
          { label: 'Total Tasks', value: totalTasks, icon: CheckCircle2 },
          { label: 'Total Habits', value: habits.length, icon: Repeat },
          { label: 'Highest Streak', value: `${highestStreak} Days`, icon: Flame },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl p-6 relative overflow-hidden flex flex-col justify-between h-[140px] group transition-colors hover:border-[var(--color-divider-strong)]">
               <div className="flex items-start justify-between mb-2">
                  <span className="text-[32px] font-medium text-[var(--color-primary)] tabular-nums leading-none tracking-tight">{stat.value}</span>
                  <Icon size={16} className="text-[var(--color-tertiary)]" strokeWidth={2} />
               </div>
               <div>
                 <p className="section-label">{stat.label}</p>
               </div>
            </div>
          );
        })}
      </div>

      {/* Tasks Analytics */}
      <div>
        <h2 className="text-[18px] font-medium text-[var(--color-primary)] tracking-tight mb-4 flex items-center gap-2">
           <CheckCircle2 size={20} className="text-[var(--color-secondary)]" />
           Tasks Analytics
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-divider)] flex flex-col h-[300px] sm:h-[380px]">
            <h3 className="section-label mb-6">Task Completion Trend</h3>
            <div className="flex-1 flex flex-col justify-end">
              {!hasAnyTaskData ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <TrendingUp size={24} className="text-[var(--color-tertiary)] mb-3" />
                    <p className="text-[13px] text-[var(--color-secondary)]">Add and complete tasks to build your trend.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={last7DaysTasks}>
                    <YAxis hide domain={[0, 100]} type="number" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-tertiary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }} dy={10} />
                    <Tooltip content={<CustomTooltipTasks />} cursor={{ fill: 'var(--color-elevated)' }} />
                    <Bar dataKey="completion" fill="var(--color-accent)" radius={[4, 4, 4, 4]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-divider)] flex flex-col h-[300px] sm:h-[380px]">
            <h3 className="section-label mb-6">Task Priority Distribution</h3>
            <div className="flex-1 relative flex items-center justify-center">
              {!hasAnyTaskData ? (
                <div className="text-center flex flex-col items-center">
                  <Target size={24} className="text-[var(--color-tertiary)] mb-3" />
                  <p className="text-[13px] text-[var(--color-secondary)]">Add tasks to see data.</p>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={priorityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {priorityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={entry.opacity} />
                        ))}
                      </Pie>
                      <Tooltip wrapperStyle={{ outline: 'none' }} contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-divider)', borderRadius: '8px', color: 'var(--color-primary)', fontSize: '13px' }} itemStyle={{ color: 'var(--color-primary)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                    <span className="text-[32px] font-medium text-[var(--color-primary)] tracking-tight tabular-nums leading-none">{totalTasks}</span>
                    <span className="text-[11px] font-medium text-[var(--color-tertiary)] uppercase tracking-[0.08em] mt-1">Tasks</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Habits Analytics */}
      <div>
        <h2 className="text-[18px] font-medium text-[var(--color-primary)] tracking-tight mb-4 flex items-center gap-2">
           <Repeat size={20} className="text-[var(--color-secondary)]" />
           Habits Analytics
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-divider)] flex flex-col h-[300px] sm:h-[380px]">
            <h3 className="section-label mb-6">Habit Completion Trend</h3>
            <div className="flex-1 flex flex-col justify-end">
              {!hasAnyHabitData ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <TrendingUp size={24} className="text-[var(--color-tertiary)] mb-3" />
                    <p className="text-[13px] text-[var(--color-secondary)]">Add and complete habits to build your trend.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={last7DaysHabits}>
                    <YAxis hide domain={[0, 100]} type="number" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-tertiary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }} dy={10} />
                    <Tooltip content={<CustomTooltipHabits />} cursor={{ fill: 'var(--color-elevated)' }} />
                    <Bar dataKey="completion" fill="var(--color-success)" radius={[4, 4, 4, 4]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-divider)] flex flex-col h-[300px] sm:h-[380px]">
            <h3 className="section-label mb-6">Top Streaks</h3>
            <div className="flex-1 relative flex flex-col justify-center px-2">
              {!hasAnyHabitData || topStreaks.every(s => s.streak === 0) ? (
                <div className="text-center flex flex-col items-center">
                  <Flame size={24} className="text-[var(--color-tertiary)] mb-3" />
                  <p className="text-[13px] text-[var(--color-secondary)]">Maintain habits to build your streaks.</p>
                </div>
              ) : (
                 <div className="space-y-4">
                    {topStreaks.filter(s => s.streak > 0).map((habit, i) => (
                       <div key={i} className="flex items-center gap-3 w-full">
                          <div className="w-[80px] text-[13px] font-medium text-[var(--color-primary)] truncate" title={habit.name}>
                             {habit.name}
                          </div>
                          <div className="flex-1 h-3 bg-[var(--color-elevated)] rounded-full overflow-hidden relative">
                             <div className="absolute top-0 left-0 h-full bg-[var(--color-success)] rounded-full transition-all" style={{ width: `${Math.min((habit.streak / 30) * 100, 100)}%` }} />
                          </div>
                          <div className="w-[50px] text-right flex items-center justify-end gap-1">
                             <Flame size={12} className="text-[var(--color-success)]" />
                             <span className="text-[14px] font-medium text-[var(--color-primary)] tabular-nums">{habit.streak}</span>
                          </div>
                       </div>
                    ))}
                 </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
