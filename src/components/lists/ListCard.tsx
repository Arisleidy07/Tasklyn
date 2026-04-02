'use client';

import React from 'react';
import Link from 'next/link';
import { TaskList } from '@/types';
import { useTaskStore } from '@/stores/taskStore';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import { useAuthStore } from '@/stores/authStore';
import { Users, CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';

interface ListCardProps {
  list: TaskList;
}

export default function ListCard({ list }: ListCardProps) {
  const { user } = useAuthStore();
  const tasks = useTaskStore((s) => s.getTasksByList(list.id));
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const isOwner = list.owner === user?.id;

  return (
    <Link href={`/lists/${list.id}`} className="group block">
      <div className="relative p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-violet-300 dark:hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-200">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors">
              {list.name}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {formatDate(list.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant={list.type === 'shared' ? 'blue' : 'default'}>
              {list.type === 'shared' ? 'Shared' : 'Personal'}
            </Badge>
            {isOwner && <Badge variant="violet">Owner</Badge>}
          </div>
        </div>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
            <span className="flex items-center gap-1">
              <CheckCircle2 size={12} />
              {completedCount}/{totalCount} tasks
            </span>
            <span>{totalCount > 0 ? Math.round(progress) : 0}%</span>
          </div>
          <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Users size={12} />
            <span>{list.members.length} member{list.members.length !== 1 ? 's' : ''}</span>
          </div>
          <ArrowRight
            size={14}
            className="text-zinc-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all"
          />
        </div>
      </div>
    </Link>
  );
}
