import React, { useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTaskStore } from '../../store/useTaskStore';
import { useHabitStore } from '../../store/useHabitStore';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { CheckCircle2, TrendingUp, Target, Flame, Repeat } from 'lucide-react';

export default function Analytics() {
  const { tasks, subscribeToTasks } = useTaskStore();
  const { habits, subscribeToHabits, subscribeToLogs, getStreak } = useHabitStore();

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
    { name: 'High', value: tasks.filter(t => t.priority === 'high').length, fill: 'var(--color-danger)' },
    { name: 'Medium', value: tasks.filter(t => t.priority === 'medium').length, fill: 'var(--color-warning)' },
    { name: 'Low', value: tasks.filter(t => t.priority === 'low').length, fill: 'var(--color-success)' },
  ];

  const last7Days = useMemo(() => {
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
        total,
      });
    }
    return days;
  }, [tasks]);

  const COLORS = ['var(--color-accent)', 'var(--color-text-tertiary)', 'var(--color-elevated)'];

  const hasAnyData = tasks.length > 0;

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Trend Chart */}
        <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-divider)] flex flex-col h-[300px] sm:h-[380px]">
          <h3 className="section-label mb-6">Weekly Completion Trend</h3>
          <div className="flex-1 flex flex-col justify-end">
            {!hasAnyData ? (
               <div className="flex-1 flex flex-col items-center justify-center">
                  <TrendingUp size={24} className="text-[var(--color-tertiary)] mb-3" />
                  <p className="text-[13px] text-[var(--color-secondary)]">Add and complete tasks to build your trend.</p>
               </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last7Days}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-tertiary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }} dy={10} />
                  <Tooltip cursor={{ fill: 'var(--color-elevated)' }} contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-divider)', borderRadius: '8px', color: 'var(--color-primary)', fontSize: '13px' }} itemStyle={{ color: 'var(--color-primary)' }} />
                  <Bar dataKey="completion" fill="var(--color-accent)" radius={[4, 4, 4, 4]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Priority Distribution Chart */}
        <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-divider)] flex flex-col h-[300px] sm:h-[380px]">
          <h3 className="section-label mb-6">Task Priority Distribution</h3>
          <div className="flex-1 relative flex items-center justify-center">
            {totalTasks === 0 ? (
              <div className="text-center flex flex-col items-center">
                <Target size={24} className="text-[var(--color-tertiary)] mb-3" />
                <p className="text-[13px] text-[var(--color-secondary)]">Add tasks to see data.</p>
              </div>
            ) : (
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
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip wrapperStyle={{ outline: 'none' }} contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-divider)', borderRadius: '8px', color: 'var(--color-primary)', fontSize: '13px' }} itemStyle={{ color: 'var(--color-primary)' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            
            {totalTasks > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                <span className="text-[32px] font-medium text-[var(--color-primary)] tracking-tight tabular-nums leading-none">{totalTasks}</span>
                <span className="text-[11px] font-medium text-[var(--color-tertiary)] uppercase tracking-[0.08em] mt-1">Tasks</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
