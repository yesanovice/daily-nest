import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Play, Pause, RotateCcw, Coffee, Brain, Settings, History } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { usePomodoroStore } from '../../store/usePomodoroStore';
import { format } from 'date-fns';

type TimerMode = 'focus' | 'short_break' | 'long_break';

const playAlarm = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const playBeep = (time: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, time);
      
      gainNode.gain.setValueAtTime(0.8, time);
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(time);
      osc.stop(time + 0.5);
    };

    playBeep(ctx.currentTime);
    playBeep(ctx.currentTime + 0.6);
    playBeep(ctx.currentTime + 1.2);
  } catch (e) {
    console.error('Audio play failed', e);
  }
};

export default function Pomodoro() {
  const { customTimes, setCustomTime, history, addSession } = usePomodoroStore();
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(customTimes.focus);
  const [isActive, setIsActive] = useState(false);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Sync time left when custom times change (only if not active)
  useEffect(() => {
    if (!isActive) {
      setTimeLeft(customTimes[mode]);
    }
  }, [customTimes, mode, isActive]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && endTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.ceil((endTime - now) / 1000);
        
        if (remaining <= 0) {
          setTimeLeft(0);
          setIsActive(false);
          setEndTime(null);
          handleSessionComplete();
        } else {
          setTimeLeft(remaining);
        }
      }, 200); // Check more frequently to keep UI responsive
    }
    
    return () => clearInterval(interval);
  }, [isActive, endTime]);

  const handleSessionComplete = () => {
    playAlarm();
    
    // Record session
    addSession({
      duration: customTimes[mode],
      completedAt: new Date().toISOString(),
      mode,
    });
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('DailyNest Timer', {
        body: mode === 'focus' ? 'Focus session completed! Great job.' : 'Break is over! Time to focus.',
      });
    }

    if (mode === 'focus') {
      const newSessions = sessionsCompleted + 1;
      setSessionsCompleted(newSessions);
      toast.success('Focus session completed! Great job.');
      
      if (newSessions % 4 === 0) {
        switchMode('long_break');
      } else {
        switchMode('short_break');
      }
    } else {
      toast.success('Break is over! Time to focus.');
      switchMode('focus');
    }
  };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(customTimes[newMode]);
    setIsActive(false);
    setEndTime(null);
  };

  const toggleTimer = () => {
    if (!isActive) {
      // Starting or resuming
      setEndTime(Date.now() + timeLeft * 1000);
      setIsActive(true);
    } else {
      // Pausing
      setIsActive(false);
      setEndTime(null);
    }
  };
  
  const resetTimer = () => {
    setIsActive(false);
    setEndTime(null);
    setTimeLeft(customTimes[mode]);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // derived values for progress ring
  const progress = ((customTimes[mode] - timeLeft) / customTimes[mode]) * 100;
  
  
  return (
    <div className="max-w-md mx-auto space-y-8 animate-in fade-in duration-500 pt-4 lg:pt-12">
      <Helmet>
        <title>Pomodoro Timer | DailyNest</title>
      </Helmet>
      
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[28px] font-medium text-[var(--color-primary)] tracking-tight">Focus</h1>
          <p className="mt-1 text-[13px] text-[var(--color-tertiary)]">Stay productive. Take breaks.</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => { setShowHistory(!showHistory); setShowSettings(false); }}
             className={clsx("p-2 rounded-full transition-colors", showHistory ? "bg-[var(--color-elevated)] text-[var(--color-primary)]" : "text-[var(--color-tertiary)] hover:bg-[var(--color-elevated)] hover:text-[var(--color-secondary)]")}
           >
             <History size={18} />
           </button>
           <button 
             onClick={() => { setShowSettings(!showSettings); setShowHistory(false); }}
             className={clsx("p-2 rounded-full transition-colors", showSettings ? "bg-[var(--color-elevated)] text-[var(--color-primary)]" : "text-[var(--color-tertiary)] hover:bg-[var(--color-elevated)] hover:text-[var(--color-secondary)]")}
           >
             <Settings size={18} />
           </button>
        </div>
      </div>

      {showSettings ? (
        <div className="bg-[var(--color-surface)] rounded-xl py-8 px-6 border border-[var(--color-divider)] animate-in fade-in slide-in-from-top-4 duration-300">
           <h3 className="section-label mb-6">Timer Settings (Minutes)</h3>
           <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-secondary)] mb-1 uppercase tracking-wide">Focus Duration</label>
                <input 
                   type="number" 
                   value={Math.floor(customTimes.focus / 60)}
                   onChange={(e) => setCustomTime('focus', Math.max(1, parseInt(e.target.value) || 25) * 60)}
                   className="w-full bg-[var(--color-base)] border border-[var(--color-divider)] rounded-lg px-3 py-2 text-[var(--color-primary)] outline-none focus:border-[var(--color-divider-strong)] transition-colors"
                   min="1"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-secondary)] mb-1 uppercase tracking-wide">Short Break</label>
                <input 
                   type="number" 
                   value={Math.floor(customTimes.short_break / 60)}
                   onChange={(e) => setCustomTime('short_break', Math.max(1, parseInt(e.target.value) || 5) * 60)}
                   className="w-full bg-[var(--color-base)] border border-[var(--color-divider)] rounded-lg px-3 py-2 text-[var(--color-primary)] outline-none focus:border-[var(--color-divider-strong)] transition-colors"
                   min="1"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-secondary)] mb-1 uppercase tracking-wide">Long Break</label>
                <input 
                   type="number" 
                   value={Math.floor(customTimes.long_break / 60)}
                   onChange={(e) => setCustomTime('long_break', Math.max(1, parseInt(e.target.value) || 15) * 60)}
                   className="w-full bg-[var(--color-base)] border border-[var(--color-divider)] rounded-lg px-3 py-2 text-[var(--color-primary)] outline-none focus:border-[var(--color-divider-strong)] transition-colors"
                   min="1"
                />
              </div>
           </div>
           
           <button 
             onClick={() => setShowSettings(false)}
             className="w-full mt-6 py-2 bg-[var(--color-elevated)] hover:bg-[var(--color-divider)] text-[var(--color-primary)] rounded-lg text-sm font-medium transition-colors"
           >
              Done
           </button>
        </div>
      ) : showHistory ? (
        <div className="bg-[var(--color-surface)] rounded-xl py-6 px-6 border border-[var(--color-divider)] max-h-[500px] overflow-y-auto animate-in fade-in slide-in-from-top-4 duration-300">
           <h3 className="section-label mb-4">Session History</h3>
           {history.length === 0 ? (
             <p className="text-[13px] text-[var(--color-tertiary)] text-center py-8">No sessions recorded yet.</p>
           ) : (
             <div className="space-y-3">
               {[...history].reverse().map(session => (
                 <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-[var(--color-base)] border border-[var(--color-divider)] text-sm">
                   <div className="flex items-center gap-3 mb-2 sm:mb-0">
                     <span className={clsx("w-2 h-2 rounded-full", session.mode === 'focus' ? 'bg-[var(--color-accent)]' : 'bg-emerald-500')} />
                     <span className="font-medium text-[var(--color-primary)] capitalize">{session.mode.replace('_', ' ')}</span>
                   </div>
                   <div className="flex items-center sm:gap-4 justify-between sm:justify-end text-[13px] text-[var(--color-tertiary)]">
                     <span>{Math.round(session.duration / 60)} min</span>
                     <span>{format(new Date(session.completedAt), 'MMM d, h:mm a')}</span>
                   </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      ) : (
        <>
          <div className="bg-[var(--color-surface)] rounded-xl py-10 px-8 border border-[var(--color-divider)] flex flex-col items-center">
        
        {/* Mode selector */}
        <div className="flex bg-[var(--color-base)] p-1 rounded-lg w-full mb-10 border border-[var(--color-divider)] relative z-10">
           <button 
             onClick={() => switchMode('focus')}
             className={clsx("flex-1 py-1.5 px-3 rounded text-[13px] font-medium transition-colors outline-none", mode === 'focus' ? "bg-[var(--color-elevated)] text-[var(--color-primary)]" : "text-[var(--color-tertiary)] hover:text-[var(--color-secondary)]")}
           >
             Focus
           </button>
           <button 
             onClick={() => switchMode('short_break')}
             className={clsx("flex-1 py-1.5 px-3 rounded text-[13px] font-medium transition-colors outline-none", mode === 'short_break' ? "bg-[var(--color-elevated)] text-[var(--color-primary)]" : "text-[var(--color-tertiary)] hover:text-[var(--color-secondary)]")}
           >
             Short Break
           </button>
           <button 
             onClick={() => switchMode('long_break')}
             className={clsx("flex-1 py-1.5 px-3 rounded text-[13px] font-medium transition-colors outline-none", mode === 'long_break' ? "bg-[var(--color-elevated)] text-[var(--color-primary)]" : "text-[var(--color-tertiary)] hover:text-[var(--color-secondary)]")}
           >
             Long Break
           </button>
        </div>

        {/* Timer Visualization */}
        <div className="relative w-64 h-64 mb-10 flex items-center justify-center text-center">
           <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
             <circle 
               cx="128" cy="128" r="120" 
               className="stroke-[var(--color-divider-strong)]" strokeWidth="4" fill="none" 
             />
             <circle 
               cx="128" cy="128" r="120" 
               className="stroke-[var(--color-accent)] transition-all duration-1000 ease-linear" 
               strokeWidth="4" fill="none" 
               strokeDasharray="753.98" 
               strokeDashoffset={753.98 - (753.98 * progress) / 100}
               strokeLinecap="round"
             />
           </svg>
           <div className="flex flex-col items-center">
             <span className="text-[48px] font-light text-[var(--color-primary)] tabular-nums tracking-tight">
                {formatTime(timeLeft)}
             </span>
             <span className="text-[11px] font-medium tracking-[0.08em] uppercase text-[var(--color-tertiary)] mt-1">
                {mode === 'focus' ? 'Focus session' : 'Resting'}
             </span>
           </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6 justify-center">
           <button 
             onClick={resetTimer}
             aria-label="Reset Timer"
             className="w-12 h-12 flex items-center justify-center text-[var(--color-tertiary)] hover:text-[var(--color-secondary)] hover:bg-[var(--color-elevated)] rounded-full transition-colors active:scale-95"
           >
             <RotateCcw size={20} aria-hidden="true" />
           </button>
           <button 
             onClick={toggleTimer}
             aria-label={isActive ? "Pause Timer" : "Start Timer"}
             className="w-14 h-14 bg-[var(--color-accent)] text-white font-medium rounded-full flex items-center justify-center transition-all hover:opacity-85 active:scale-95"
           >
             {isActive ? <Pause size={24} fill="currentColor" aria-hidden="true" /> : <Play size={24} fill="currentColor" className="ml-1" aria-hidden="true" />}
           </button>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 justify-center pt-2">
        <div className="flex items-center gap-2">
          {[...Array(4)].map((_, i) => (
            <div 
               key={i} 
               className={clsx(
                 "w-10 h-1 rounded-sm transition-colors",
                 i < (sessionsCompleted % 4) ? "bg-[var(--color-accent)]" : "bg-[var(--color-elevated)]"
               )} 
            />
          ))}
        </div>
        <p className="text-center text-[13px] text-[var(--color-secondary)]">
          {sessionsCompleted} total focus sessions completed
        </p>
      </div>
      </>
      )}
    </div>
  );
}
