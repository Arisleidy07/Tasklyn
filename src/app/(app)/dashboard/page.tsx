'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useListStore } from '@/stores/listStore';
import Header from '@/components/layout/Header';
import ListCard from '@/components/lists/ListCard';
import CreateListModal from '@/components/lists/CreateListModal';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Plus, ListTodo, FolderOpen, Users, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { PLAN_LIMITS } from '@/types';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { getPersonalLists, getSharedLists, getUserLists } = useListStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (!user) return null;

  const personalLists = getPersonalLists(user.id);
  const sharedLists = getSharedLists(user.id);
  const allLists = getUserLists(user.id);
  const limits = PLAN_LIMITS[user.plan];
  const canCreate = allLists.length < limits.maxLists;

  return (
    <>
      <Header
        title="Dashboard"
        description={`Welcome back, ${user.name.split(' ')[0]}`}
        actions={
          <Button
            onClick={() => setShowCreateModal(true)}
            icon={<Plus size={16} />}
            disabled={!canCreate}
          >
            New list
          </Button>
        }
      />

      <div className="p-6 space-y-8 max-w-5xl">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <FolderOpen size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {allLists.length}
              </p>
              <p className="text-xs text-zinc-500">Total lists</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Users size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {sharedLists.length}
              </p>
              <p className="text-xs text-zinc-500">Shared lists</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {user.plan}
              </p>
              <p className="text-xs text-zinc-500">Current plan</p>
            </div>
          </div>
        </div>

        {/* Personal Lists */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Personal Lists
            </h2>
            <Badge>{personalLists.length}</Badge>
          </div>
          {personalLists.length === 0 ? (
            <EmptyState
              icon={<ListTodo size={24} />}
              title="No personal lists yet"
              description="Create your first personal list to start organizing your tasks."
              action={
                <Button
                  size="sm"
                  onClick={() => setShowCreateModal(true)}
                  icon={<Plus size={14} />}
                >
                  Create list
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {personalLists.map((list, i) => (
                <motion.div
                  key={list.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <ListCard list={list} />
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Shared Lists */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Shared Lists
            </h2>
            <Badge variant="blue">{sharedLists.length}</Badge>
          </div>
          {sharedLists.length === 0 ? (
            <EmptyState
              icon={<Users size={24} />}
              title="No shared lists yet"
              description="Create a shared list or accept an invitation to collaborate with others."
              action={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCreateModal(true)}
                  icon={<Plus size={14} />}
                >
                  Create shared list
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sharedLists.map((list, i) => (
                <motion.div
                  key={list.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <ListCard list={list} />
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Plan limit notice */}
        {!canCreate && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
            <p className="text-sm text-amber-800 dark:text-amber-400 font-medium">
              You&apos;ve reached the limit of {limits.maxLists} lists on the{' '}
              {user.plan} plan.
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
              Upgrade to PRO for unlimited lists, tasks, and team members.
            </p>
          </div>
        )}
      </div>

      <CreateListModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </>
  );
}
