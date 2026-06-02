import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import {
  CheckSquare,
  Repeat,
  Book,
  ChevronRight,
  X,
  Sparkles,
} from "lucide-react";
import { useTaskStore } from "../../store/useTaskStore";
import { useHabitStore } from "../../store/useHabitStore";
import { useJournalStore } from "../../store/useJournalStore";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "motion/react";
import clsx from "clsx";

export default function QuickAdd() {
  const navigate = useNavigate();
  const [type, setType] = useState<"task" | "habit" | "journal">("task");
  const [title, setTitle] = useState("");

  const addTask = useTaskStore((s) => s.addTask);
  const addHabit = useHabitStore((s) => s.addHabit);
  const addEntry = useJournalStore((s) => s.addEntry);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      if (type === "task") {
        await addTask(title.trim(), "medium");
        toast.success("Task added");
        navigate("/tasks");
      } else if (type === "habit") {
        await addHabit(title.trim(), "daily", "bg-indigo-500");
        toast.success("Habit added");
        navigate("/habits");
      } else if (type === "journal") {
        await addEntry(
          title.trim(),
          "A quick thought...",
          "great",
          new Date().toISOString(),
        );
        toast.success("Journal entry started");
        navigate("/journal");
      }
    } catch (error) {
      toast.error("Failed to add");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pt-4 md:py-8 max-w-2xl mx-auto">
      <Helmet>
        <title>Quick Add | DailyNest</title>
      </Helmet>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-medium text-[var(--color-primary)] tracking-tight flex items-center gap-2">
            <Sparkles size={24} className="text-[var(--color-secondary)]" />
            Quick Add
          </h1>
          <p className="mt-1 text-[13px] text-[var(--color-tertiary)]">
            What's on your mind?
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-[var(--color-surface)] border border-[var(--color-divider)] text-[var(--color-tertiary)] hover:text-[var(--color-primary)] rounded-full hover:bg-[var(--color-elevated)] transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="bg-[var(--color-surface)] p-6 sm:p-8 rounded-[10px] border border-[var(--color-divider)]">
        <div className="flex gap-2 sm:gap-4 mb-8 bg-[var(--color-elevated)] p-1.5 rounded-lg border border-[var(--color-divider)]">
          <button
            onClick={() => setType("task")}
            className={clsx(
              "flex-1 py-2 px-2 rounded-md font-medium text-[13px] flex items-center justify-center gap-2 transition-colors",
              type === "task"
                ? "bg-[var(--color-surface)] text-[var(--color-primary)] border border-[var(--color-divider)]"
                : "text-[var(--color-tertiary)] hover:text-[var(--color-secondary)] hover:bg-[var(--color-surface)]",
            )}
          >
            <CheckSquare size={16} />
            Task
          </button>
          <button
            onClick={() => setType("habit")}
            className={clsx(
              "flex-1 py-2 px-2 rounded-md font-medium text-[13px] flex items-center justify-center gap-2 transition-colors",
              type === "habit"
                ? "bg-[var(--color-surface)] text-[var(--color-primary)] border border-[var(--color-divider)]"
                : "text-[var(--color-tertiary)] hover:text-[var(--color-secondary)] hover:bg-[var(--color-surface)]",
            )}
          >
            <Repeat size={16} />
            Habit
          </button>
          <button
            onClick={() => setType("journal")}
            className={clsx(
              "flex-1 py-2 px-2 rounded-md font-medium text-[13px] flex items-center justify-center gap-2 transition-colors",
              type === "journal"
                ? "bg-[var(--color-surface)] text-[var(--color-primary)] border border-[var(--color-divider)]"
                : "text-[var(--color-tertiary)] hover:text-[var(--color-secondary)] hover:bg-[var(--color-surface)]",
            )}
          >
            <Book size={16} />
            Journal
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="text-[11px] font-medium text-[var(--color-tertiary)] uppercase tracking-[0.08em] block mb-2">
              {type === "task"
                ? "Task Name"
                : type === "habit"
                  ? "Habit Title"
                  : "Journal Title"}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === "task"
                  ? "Buy groceries..."
                  : type === "habit"
                    ? "Drink water..."
                    : "Morning reflection..."
              }
              className="w-full text-xl font-medium bg-transparent border-0 border-b border-[var(--color-divider)] focus:border-[var(--color-divider-strong)] focus:ring-0 px-0 py-3 placeholder-[var(--color-tertiary)] transition-colors outline-none text-[var(--color-primary)]"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={!title.trim()}
            className="w-full py-4 bg-[var(--color-primary)] text-[var(--color-bg-base)] rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 active:scale-95"
          >
            Create{" "}
            {type === "task" ? "Task" : type === "habit" ? "Habit" : "Entry"}
            <ChevronRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
