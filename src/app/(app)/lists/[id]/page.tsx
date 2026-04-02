"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useListStore } from "@/stores/listStore";
import { useTaskStore } from "@/stores/taskStore";
import {
  getUserRole,
  canCreateTask,
  canShareList,
  canDeleteList,
} from "@/lib/permissions";
import Header from "@/components/layout/Header";
import TaskItem from "@/components/tasks/TaskItem";
import CreateTaskForm from "@/components/tasks/CreateTaskForm";
import MembersPanel from "@/components/members/MembersPanel";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Users,
  Share2,
  Trash2,
  CheckCircle2,
  Circle,
  ListTodo,
  Filter,
} from "lucide-react";

type FilterType = "all" | "pending" | "completed";

// Demo member names lookup (will come from Firebase later)
const DEMO_NAMES: Record<string, string> = {};

export default function ListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listId = params?.id as string;

  const { user } = useAuthStore();
  const { getList, deleteList } = useListStore();
  const { getTasksByList, deleteTasksByList } = useTaskStore();

  const [showMembers, setShowMembers] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");

  const list = getList(listId);
  const tasks = getTasksByList(listId);

  // Build original names (from profile/Firebase) and display names (with per-list custom overrides)
  const { memberNames, originalNames } = useMemo(() => {
    const originals: Record<string, string> = { ...DEMO_NAMES };
    if (user) {
      originals[user.id] = user.name;
    }
    // In production, fetch all member profiles from Firebase
    list?.members.forEach((m) => {
      if (!originals[m.userId]) {
        originals[m.userId] = `User ${m.userId.slice(0, 6)}`;
      }
    });
    // Display names = originals + per-list custom name overrides set by the owner
    const display = { ...originals };
    if (list?.customNames) {
      for (const [userId, customName] of Object.entries(list.customNames)) {
        if (customName) {
          display[userId] = customName;
        }
      }
    }
    return { memberNames: display, originalNames: originals };
  }, [user, list]);

  if (!user || !list) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-sm text-zinc-500">List not found</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => router.push("/dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const role = getUserRole(list, user.id);
  const canAdd = canCreateTask(role);
  const canShare = canShareList(role);
  const canDelete = canDeleteList(role);

  const filteredTasks = tasks.filter((t) => {
    if (filter === "pending") return t.status === "pending";
    if (filter === "completed") return t.status === "completed";
    return true;
  });

  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  const handleDeleteList = () => {
    if (!canDelete) return;
    if (
      confirm("Are you sure you want to delete this list and all its tasks?")
    ) {
      deleteTasksByList(list.id);
      deleteList(list.id);
      router.push("/dashboard");
    }
  };

  return (
    <>
      <Header
        title={list.name}
        description={`${list.type === "shared" ? "Shared" : "Personal"} list · ${tasks.length} tasks`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
              icon={<ArrowLeft size={14} />}
            >
              Back
            </Button>
            {canShare && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMembers(true)}
                icon={<Share2 size={14} />}
              >
                Share
              </Button>
            )}
            {!canShare && list.type === "shared" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMembers(true)}
                icon={<Users size={14} />}
              >
                Members
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteList}
                icon={<Trash2 size={14} />}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                Delete
              </Button>
            )}
          </div>
        }
      />

      <div className="p-6 max-w-3xl">
        {/* Stats bar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Circle size={14} className="text-zinc-400" />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {pendingCount} pending
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {completedCount} completed
            </span>
          </div>
          <div className="flex-1" />
          {/* Filter */}
          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
            {(["all", "pending", "completed"] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  filter === f
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Role badge */}
        {role && (
          <div className="mb-4">
            <Badge
              variant={
                role === "owner"
                  ? "violet"
                  : role === "editor"
                    ? "blue"
                    : "default"
              }
            >
              Your role: {role}
            </Badge>
            {role === "viewer" && (
              <span className="text-xs text-zinc-400 ml-2">
                Read-only access
              </span>
            )}
            {role === "editor" && (
              <span className="text-xs text-zinc-400 ml-2">
                Can create and edit tasks
              </span>
            )}
          </div>
        )}

        {/* Task list */}
        <div className="space-y-3">
          {canAdd && <CreateTaskForm listId={list.id} />}

          <AnimatePresence mode="popLayout">
            {filteredTasks.length === 0 ? (
              <EmptyState
                icon={<ListTodo size={24} />}
                title={filter === "all" ? "No tasks yet" : `No ${filter} tasks`}
                description={
                  filter === "all"
                    ? "Add your first task to get started."
                    : `There are no ${filter} tasks in this list.`
                }
              />
            ) : (
              filteredTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  role={role}
                  memberNames={memberNames}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Members Panel */}
      <MembersPanel
        list={list}
        memberNames={memberNames}
        originalNames={originalNames}
        isOpen={showMembers}
        onClose={() => setShowMembers(false)}
      />
    </>
  );
}
