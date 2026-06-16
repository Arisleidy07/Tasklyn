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
  const tasksWithDates = useMemo(() => tasks.filter((t) => t.dueDate), [tasks]);

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
        { locale: es },
      )}`;
    } else {
      return format(currentDate, "EEEE, d MMMM yyyy", { locale: es });
    }
  };

  return (
    <div
      className={cn("rounded-2xl shadow-sm", className)}
      style={{ backgroundColor: "var(--bg-card)" }}
    >
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b gap-3"
        style={{ borderColor: "var(--border-color)" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={goToPrevious}
              className="p-2 rounded-lg transition-colors"
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={goToNext}
              className="p-2 rounded-lg transition-colors"
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <h2
            className="text-lg font-semibold capitalize"
            style={{ color: "var(--text-primary)" }}
          >
            {getHeaderDate()}
          </h2>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
            style={{ color: "#2563eb" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(37,99,235,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Hoy
          </button>
        </div>

        {/* View selector */}
        <div
          className="flex items-center gap-1 p-1 rounded-lg"
          style={{ backgroundColor: "var(--bg-secondary)" }}
        >
          {(["month", "week", "day"] as CalendarView[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                view === v ? "shadow-sm" : "",
              )}
              style={
                view === v
                  ? {
                      backgroundColor: "var(--bg-card)",
                      color: "var(--text-primary)",
                    }
                  : { color: "var(--text-secondary)" }
              }
              onMouseEnter={(e) => {
                if (view !== v)
                  e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
              }}
              onMouseLeave={(e) => {
                if (view !== v)
                  e.currentTarget.style.backgroundColor = "transparent";
              }}
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
            className="text-center text-xs font-medium py-2"
            style={{ color: "var(--text-secondary)" }}
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
                isCurrentMonth ? "" : "",
                isTodayDate && "ring-2 ring-blue-500 ring-offset-1",
              )}
              style={
                isCurrentMonth
                  ? {
                      backgroundColor: "var(--bg-card)",
                      borderColor: "var(--border-color)",
                    }
                  : { backgroundColor: "var(--bg-secondary)" }
              }
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#93c5fd";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isCurrentMonth
                  ? "var(--border-color)"
                  : "transparent";
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    "text-sm font-medium",
                    isTodayDate
                      ? "w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center"
                      : "",
                  )}
                  style={
                    isTodayDate
                      ? {}
                      : {
                          color: isCurrentMonth
                            ? "var(--text-primary)"
                            : "var(--text-tertiary)",
                        }
                  }
                >
                  {format(day, "d")}
                </span>
                {dayTasks.length > 0 && (
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
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
                      task.status === "completed" ? "line-through" : "",
                    )}
                    style={
                      task.status === "completed"
                        ? {
                            backgroundColor: "rgba(34,197,94,0.1)",
                            color: "#16a34a",
                          }
                        : task.priority === "urgent"
                          ? {
                              backgroundColor: "rgba(239,68,68,0.1)",
                              color: "#dc2626",
                            }
                          : task.priority === "high"
                            ? {
                                backgroundColor: "rgba(249,115,22,0.1)",
                                color: "#ea580c",
                              }
                            : {
                                backgroundColor: "rgba(59,130,246,0.1)",
                                color: "#2563eb",
                              }
                    }
                  >
                    {task.title}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div
                    className="text-xs text-center"
                    style={{ color: "var(--text-tertiary)" }}
                  >
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
            className={cn("min-h-[300px] rounded-xl border p-3")}
            style={
              isTodayDate
                ? {
                    backgroundColor: "rgba(59,130,246,0.05)",
                    borderColor: "rgba(59,130,246,0.3)",
                  }
                : {
                    backgroundColor: "var(--bg-card)",
                    borderColor: "var(--border-color)",
                  }
            }
          >
            <div
              className="text-center mb-3 pb-2 border-b"
              style={{ borderColor: "var(--border-color)" }}
            >
              <p
                className="text-xs uppercase"
                style={{ color: "var(--text-secondary)" }}
              >
                {format(day, "EEE", { locale: es })}
              </p>
              <p
                className={cn("text-lg font-semibold")}
                style={
                  isTodayDate
                    ? { color: "#2563eb" }
                    : { color: "var(--text-primary)" }
                }
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
                  )}
                  style={
                    task.status === "completed"
                      ? {
                          backgroundColor: "rgba(34,197,94,0.1)",
                          borderColor: "rgba(34,197,94,0.2)",
                        }
                      : task.priority === "urgent"
                        ? {
                            backgroundColor: "rgba(239,68,68,0.1)",
                            borderColor: "rgba(239,68,68,0.2)",
                          }
                        : task.priority === "high"
                          ? {
                              backgroundColor: "rgba(249,115,22,0.1)",
                              borderColor: "rgba(249,115,22,0.2)",
                            }
                          : {
                              backgroundColor: "rgba(59,130,246,0.1)",
                              borderColor: "rgba(59,130,246,0.2)",
                            }
                  }
                >
                  <div className="flex items-start gap-2">
                    {task.status === "completed" ? (
                      <CheckCircle2
                        size={14}
                        className="text-green-500 mt-0.5"
                      />
                    ) : (
                      <Circle
                        size={14}
                        className="mt-0.5"
                        style={{ color: "var(--text-tertiary)" }}
                      />
                    )}
                    <p
                      className={cn(
                        "text-sm font-medium",
                        task.status === "completed" ? "line-through" : "",
                      )}
                      style={
                        task.status === "completed"
                          ? { color: "#16a34a" }
                          : { color: "var(--text-primary)" }
                      }
                    >
                      {task.title}
                    </p>
                  </div>
                  {task.dueTime && (
                    <p
                      className="text-xs mt-1 ml-5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <Clock size={10} className="inline mr-1" />
                      {task.dueTime}
                    </p>
                  )}
                </div>
              ))}
              {dayTasks.length === 0 && (
                <p
                  className="text-xs text-center py-4"
                  style={{ color: "var(--text-tertiary)" }}
                >
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
      <h4
        className="text-sm font-medium uppercase tracking-wider mb-3 flex items-center gap-2"
        style={{ color: "var(--text-secondary)" }}
      >
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
              )}
              style={
                task.status === "completed"
                  ? {
                      backgroundColor: "rgba(34,197,94,0.1)",
                      borderColor: "rgba(34,197,94,0.2)",
                    }
                  : task.priority === "urgent"
                    ? {
                        backgroundColor: "rgba(239,68,68,0.1)",
                        borderColor: "rgba(239,68,68,0.2)",
                      }
                    : task.priority === "high"
                      ? {
                          backgroundColor: "rgba(249,115,22,0.1)",
                          borderColor: "rgba(249,115,22,0.2)",
                        }
                      : {
                          backgroundColor: "var(--bg-card)",
                          borderColor: "var(--border-color)",
                        }
              }
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                    task.status === "completed" ? "bg-green-500" : "border-2",
                  )}
                  style={
                    task.status !== "completed"
                      ? { borderColor: "var(--border-color)" }
                      : {}
                  }
                >
                  {task.status === "completed" && (
                    <CheckCircle2 size={14} className="text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <h5
                    className={cn(
                      "font-medium",
                      task.status === "completed" ? "line-through" : "",
                    )}
                    style={
                      task.status === "completed"
                        ? { color: "#16a34a" }
                        : { color: "var(--text-primary)" }
                    }
                  >
                    {task.title}
                  </h5>
                  {task.description && (
                    <p
                      className="text-sm mt-1"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    {task.dueTime && (
                      <span
                        className="text-xs flex items-center gap-1"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        <Clock size={12} />
                        {task.dueTime}
                      </span>
                    )}
                    {task.listId && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-secondary)",
                        }}
                      >
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
        <p className="text-sm italic" style={{ color: "var(--text-tertiary)" }}>
          No hay tareas para esta hora
        </p>
      )}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <TimeSection
        title="Mañana"
        icon={CalendarIcon}
        sectionTasks={morningTasks}
      />
      <TimeSection
        title="Tarde"
        icon={CalendarIcon}
        sectionTasks={afternoonTasks}
      />
      <TimeSection
        title="Noche"
        icon={CalendarIcon}
        sectionTasks={eveningTasks}
      />

      {noTimeTasks.length > 0 && (
        <div
          className="mt-6 pt-6 border-t"
          style={{ borderColor: "var(--border-color)" }}
        >
          <h4
            className="text-sm font-medium uppercase tracking-wider mb-3"
            style={{ color: "var(--text-secondary)" }}
          >
            Sin hora específica
          </h4>
          <div className="space-y-2">
            {noTimeTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onTaskClick?.(task)}
                className="p-3 rounded-lg border cursor-pointer"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  borderColor: "var(--border-color)",
                }}
              >
                <p
                  className="font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
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
