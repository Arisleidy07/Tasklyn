"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  isToday,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

// Calendar view types
type CalendarView = "month" | "week" | "day";

interface TaskCalendarProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  className?: string;
}

export function TaskCalendar({
  tasks,
  onTaskClick,
  className,
}: TaskCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("month");

  // Get tasks with due dates
  const tasksWithDates = useMemo(
    () => tasks.filter((t) => t.dueDate),
    [tasks]
  );

  // Navigation functions
  const goToPrevious = () => {
    if (view === "month") setCurrentDate(subMonths(currentDate, 1));
    else if (view === "week") setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const goToNext = () => {
    if (view === "month") setCurrentDate(addMonths(currentDate, 1));
    else if (view === "week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const goToToday = () => setCurrentDate(new Date());

  // Get tasks for a specific day
  const getTasksForDay = (day: Date) => {
    return tasksWithDates.filter((task) => {
      if (!task.dueDate) return false;
      const taskDate = parseISO(task.dueDate);
      return isSameDay(taskDate, day);
    });
  };

  // Month view
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { locale: es });
    const calendarEnd = endOfWeek(monthEnd, { locale: es });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  // Week view
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { locale: es });
    const weekEnd = endOfWeek(currentDate, { locale: es });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate]);

  // Format date based on view
  const getHeaderDate = () => {
    if (view === "month") {
      return format(currentDate, "MMMM yyyy", { locale: es });
    } else if (view === "week") {
      const weekStart = startOfWeek(currentDate, { locale: es });
      const weekEnd = endOfWeek(currentDate, { locale: es });
      return `${format(weekStart, "d MMM", { locale: es })} - ${format(
        weekEnd,
        "d MMM yyyy",
        { locale: es }
      )}`;
    } else {
      return format(currentDate, "EEEE, d MMMM yyyy", { locale: es });
    }
  };

  return (
    <div className={cn("bg-white dark:bg-slate-900 rounded-2xl shadow-sm", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-gray-100 dark:border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={goToPrevious}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={goToNext}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <h2 className="text-lg font-semibold capitalize text-gray-900 dark:text-slate-100">
            {getHeaderDate()}
          </h2>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
          >
            Hoy
          </button>
        </div>

        {/* View selector */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
          {(["month", "week", "day"] as CalendarView[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                view === v
                  ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-sm"
                  : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
              )}
            >
              {v === "month" ? "Mes" : v === "week" ? "Semana" : "Día"}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar content */}
      <div className="p-4">
        {view === "month" && (
          <MonthView
            days={monthDays}
            currentDate={currentDate}
            getTasksForDay={getTasksForDay}
            onTaskClick={onTaskClick}
          />
        )}
        {view === "week" && (
          <WeekView
            days={weekDays}
            getTasksForDay={getTasksForDay}
            onTaskClick={onTaskClick}
          />
        )}
        {view === "day" && (
          <DayView
            day={currentDate}
            tasks={getTasksForDay(currentDate)}
            onTaskClick={onTaskClick}
          />
        )}
      </div>
    </div>
  );
}

// Month View Component
interface MonthViewProps {
  days: Date[];
  currentDate: Date;
  getTasksForDay: (day: Date) => Task[];
  onTaskClick?: (task: Task) => void;
}

function MonthView({
  days,
  currentDate,
  getTasksForDay,
  onTaskClick,
}: MonthViewProps) {
  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
    <div>
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-500 dark:text-slate-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const dayTasks = getTasksForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isTodayDate = isToday(day);

          return (
            <motion.div
              key={day.toISOString()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.005 }}
              className={cn(
                "min-h-[100px] p-2 rounded-lg border transition-all cursor-pointer",
                isCurrentMonth
                  ? "bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800"
                  : "bg-gray-50 dark:bg-slate-950/50 border-transparent",
                isTodayDate &&
                  "ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-slate-900",
                "hover:border-blue-300 dark:hover:border-blue-500/30"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    "text-sm font-medium",
                    isTodayDate
                      ? "w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center"
                      : isCurrentMonth
                        ? "text-gray-700 dark:text-slate-300"
                        : "text-gray-400 dark:text-slate-600"
                  )}
                >
                  {format(day, "d")}
                </span>
                {dayTasks.length > 0 && (
                  <span className="text-xs text-gray-400">
                    {dayTasks.length}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskClick?.(task);
                    }}
                    className={cn(
                      "text-xs px-2 py-1 rounded truncate cursor-pointer transition-colors",
                      task.status === "completed"
                        ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 line-through"
                        : task.priority === "urgent"
                          ? "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"
                          : task.priority === "high"
                            ? "bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400"
                            : "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400"
                    )}
                  >
                    {task.title}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-xs text-gray-400 text-center">
                    +{dayTasks.length - 3} más
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// Week View Component
interface WeekViewProps {
  days: Date[];
  getTasksForDay: (day: Date) => Task[];
  onTaskClick?: (task: Task) => void;
}

function WeekView({ days, getTasksForDay, onTaskClick }: WeekViewProps) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day) => {
        const dayTasks = getTasksForDay(day);
        const isTodayDate = isToday(day);

        return (
          <div
            key={day.toISOString()}
            className={cn(
              "min-h-[300px] rounded-xl border p-3",
              isTodayDate
                ? "bg-blue-50/50 dark:bg-blue-500/5 border-blue-200 dark:border-blue-500/30"
                : "bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800"
            )}
          >
            <div className="text-center mb-3 pb-2 border-b border-gray-100 dark:border-slate-800">
              <p className="text-xs text-gray-500 dark:text-slate-400 uppercase">
                {format(day, "EEE", { locale: es })}
              </p>
              <p
                className={cn(
                  "text-lg font-semibold",
                  isTodayDate
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-900 dark:text-slate-100"
                )}
              >
                {format(day, "d")}
              </p>
            </div>

            <div className="space-y-2">
              {dayTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onTaskClick?.(task)}
                  className={cn(
                    "p-2 rounded-lg cursor-pointer transition-all hover:shadow-sm",
                    task.status === "completed"
                      ? "bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20"
                      : task.priority === "urgent"
                        ? "bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20"
                        : task.priority === "high"
                          ? "bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20"
                          : "bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {task.status === "completed" ? (
                      <CheckCircle2 size={14} className="text-green-500 mt-0.5" />
                    ) : (
                      <Circle size={14} className="text-gray-400 mt-0.5" />
                    )}
                    <p
                      className={cn(
                        "text-sm font-medium",
                        task.status === "completed"
                          ? "text-green-700 dark:text-green-400 line-through"
                          : "text-gray-900 dark:text-slate-200"
                      )}
                    >
                      {task.title}
                    </p>
                  </div>
                  {task.dueTime && (
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 ml-5">
                      <Clock size={10} className="inline mr-1" />
                      {task.dueTime}
                    </p>
                  )}
                </div>
              ))}
              {dayTasks.length === 0 && (
                <p className="text-xs text-gray-400 dark:text-slate-500 text-center py-4">
                  Sin tareas
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Day View Component
interface DayViewProps {
  day: Date;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

function DayView({ day, tasks, onTaskClick }: DayViewProps) {
  // Group tasks by time
  const morningTasks = tasks.filter((t) => {
    if (!t.dueTime) return false;
    const hour = parseInt(t.dueTime.split(":")[0]);
    return hour >= 6 && hour < 12;
  });

  const afternoonTasks = tasks.filter((t) => {
    if (!t.dueTime) return false;
    const hour = parseInt(t.dueTime.split(":")[0]);
    return hour >= 12 && hour < 18;
  });

  const eveningTasks = tasks.filter((t) => {
    if (!t.dueTime) return false;
    const hour = parseInt(t.dueTime.split(":")[0]);
    return hour >= 18 || hour < 6;
  });

  const noTimeTasks = tasks.filter((t) => !t.dueTime);

  const TimeSection = ({
    title,
    icon: Icon,
    sectionTasks,
  }: {
    title: string;
    icon: any;
    sectionTasks: Task[];
  }) => (
    <div className="mb-6">
      <h4 className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <Icon size={14} />
        {title}
      </h4>
      {sectionTasks.length > 0 ? (
        <div className="space-y-2">
          {sectionTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => onTaskClick?.(task)}
              className={cn(
                "p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md",
                task.status === "completed"
                  ? "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20"
                  : task.priority === "urgent"
                    ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20"
                    : task.priority === "high"
                      ? "bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20"
                      : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                    task.status === "completed"
                      ? "bg-green-500"
                      : "border-2 border-gray-300 dark:border-slate-600"
                  )}
                >
                  {task.status === "completed" && (
                    <CheckCircle2 size={14} className="text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <h5
                    className={cn(
                      "font-medium",
                      task.status === "completed"
                        ? "text-green-700 dark:text-green-400 line-through"
                        : "text-gray-900 dark:text-slate-100"
                    )}
                  >
                    {task.title}
                  </h5>
                  {task.description && (
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    {task.dueTime && (
                      <span className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1">
                        <Clock size={12} />
                        {task.dueTime}
                      </span>
                    )}
                    {task.listId && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400">
                        Lista
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 dark:text-slate-500 italic">
          No hay tareas para esta hora
        </p>
      )}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <TimeSection title="Mañana" icon={CalendarIcon} sectionTasks={morningTasks} />
      <TimeSection title="Tarde" icon={CalendarIcon} sectionTasks={afternoonTasks} />
      <TimeSection title="Noche" icon={CalendarIcon} sectionTasks={eveningTasks} />

      {noTimeTasks.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
          <h4 className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Sin hora específica
          </h4>
          <div className="space-y-2">
            {noTimeTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onTaskClick?.(task)}
                className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 cursor-pointer"
              >
                <p className="font-medium text-gray-900 dark:text-slate-100">
                  {task.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskCalendar;
