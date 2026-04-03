"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { TaskList } from "@/types";
import { useTaskStore } from "@/stores/taskStore";
import { useAuthStore } from "@/stores/authStore";
import {
  Users,
  CheckCircle2,
  ArrowUpRight,
  Lock,
  Share2,
  Clock,
} from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

interface ListCardProps {
  list: TaskList;
}

export default function ListCard({ list }: ListCardProps) {
  const { user } = useAuthStore();
  const { tasks } = useTaskStore();

  const listTasks = useMemo(() => {
    return tasks.filter((t) => t.listId === list.id);
  }, [tasks, list.id]);

  const completedCount = listTasks.filter(
    (t) => t.status === "completed",
  ).length;
  const totalCount = listTasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const pendingCount = totalCount - completedCount;

  const isOwner = list.owner === user?.id;

  return (
    <Link
      href={`/lists/${list.id}`}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-2xl"
    >
      <div className="relative p-5 rounded-xl border border-gray-200 bg-white hover:border-blue-400 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-[15px] font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                {list.name}
              </h3>
              <ArrowUpRight
                size={14}
                className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all flex-shrink-0"
              />
            </div>
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              <Clock size={10} />
              {formatDate(list.createdAt)}
            </p>
          </div>
          <div
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0",
              list.type === "shared"
                ? "bg-blue-50 text-blue-600"
                : "bg-gray-100 text-gray-500",
            )}
          >
            {list.type === "shared" ? <Share2 size={14} /> : <Lock size={14} />}
          </div>
        </div>

        {/* Task count */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-semibold text-gray-900">{pendingCount}</span>
            <span className="text-gray-500 text-xs">pending</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <CheckCircle2 size={14} className="text-blue-500" />
            <span className="font-semibold text-gray-900">
              {completedCount}
            </span>
            <span className="text-gray-500 text-xs">done</span>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">
              {completedCount}/{totalCount} tasks
            </span>
            <span className="font-medium text-gray-700">
              {totalCount > 0 ? Math.round(progress) : 0}%
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <Users size={12} className="text-gray-400" />
            <span className="text-xs text-gray-500">
              {list.members.length} member{list.members.length !== 1 ? "s" : ""}
            </span>
          </div>
          {isOwner && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              Owner
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
