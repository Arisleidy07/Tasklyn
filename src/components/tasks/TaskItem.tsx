'use client';

import React, { useState } from 'react';
import { Task, MemberRole } from '@/types';
import { useTaskStore } from '@/stores/taskStore';
import { useAuthStore } from '@/stores/authStore';
import { canCompleteTask, canEditTask, canDeleteTask } from '@/lib/permissions';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Trash2,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  History,
} from 'lucide-react';
import { cn, formatDateTime, timeAgo } from '@/lib/utils';

interface TaskItemProps {
  task: Task;
  role: MemberRole | null;
  memberNames: Record<string, string>;
}

export default function TaskItem({ task, role, memberNames }: TaskItemProps) {
  const [expanded, setExpanded] = useState(false);
  const { user } = useAuthStore();
  const { completeTask, uncompleteTask, deleteTask } = useTaskStore();

  const isCompleted = task.status === 'completed';
  const canComplete = canCompleteTask(role);
  const canEdit = canEditTask(role);
  const canDelete = canDeleteTask(role);

  const getUserName = (userId: string) => memberNames[userId] || 'Unknown User';

  const handleToggleComplete = () => {
    if (!user || !canComplete) return;
    if (isCompleted) {
      uncompleteTask(task.id, user.id);
    } else {
      completeTask(task.id, user.id);
    }
  };

  const handleDelete = () => {
    if (!canDelete) return;
    deleteTask(task.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={cn(
        'group rounded-xl border transition-all duration-200',
        isCompleted
          ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-500/5'
          : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'
      )}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Checkbox */}
        <button
          onClick={handleToggleComplete}
          disabled={!canComplete}
          className={cn(
            'mt-0.5 flex-shrink-0 transition-colors cursor-pointer',
            canComplete ? 'hover:text-violet-600' : 'cursor-not-allowed opacity-50',
            isCompleted ? 'text-emerald-500' : 'text-zinc-300 dark:text-zinc-600'
          )}
          title={canComplete ? (isCompleted ? 'Reopen task' : 'Complete task') : 'Only the owner can complete tasks'}
        >
          {isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  'text-sm font-medium transition-colors',
                  isCompleted
                    ? 'text-zinc-400 line-through dark:text-zinc-500'
                    : 'text-zinc-900 dark:text-zinc-100'
                )}
              >
                {task.title}
              </p>
              {task.description && (
                <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{task.description}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="p-1 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Meta */}
          <div className="flex items-center flex-wrap gap-2 mt-2">
            <span className="flex items-center gap-1 text-[11px] text-zinc-400">
              <Clock size={10} />
              {timeAgo(task.createdAt)}
            </span>
            {task.assignedTo && (
              <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                <User size={10} />
                {getUserName(task.assignedTo)}
              </span>
            )}
            {isCompleted && task.completedBy && (
              <Badge variant="success">
                Completed by: {getUserName(task.completedBy)}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Expanded: History */}
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-zinc-100 dark:border-zinc-800"
        >
          <div className="p-4 pt-3">
            <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 mb-2">
              <History size={12} />
              Activity
            </p>
            <div className="space-y-1.5">
              {task.history.map((entry) => (
                <div key={entry.id} className="flex items-start gap-2 text-[11px] text-zinc-500">
                  <div className="w-1 h-1 rounded-full bg-zinc-300 mt-1.5 flex-shrink-0" />
                  <span>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      {getUserName(entry.performedBy)}
                    </span>{' '}
                    {entry.details || entry.action}
                    <span className="text-zinc-400 ml-1">{timeAgo(entry.performedAt)}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
