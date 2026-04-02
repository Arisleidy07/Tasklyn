'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useListStore } from '@/stores/listStore';
import { useAuthStore } from '@/stores/authStore';
import { ListType } from '@/types';
import { canCreateMoreLists } from '@/lib/permissions';
import { List, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateListModal({ isOpen, onClose }: CreateListModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<ListType>('personal');
  const { user } = useAuthStore();
  const { createList, getUserLists } = useListStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user) return;

    const userLists = getUserLists(user.id);
    if (!canCreateMoreLists(userLists.length, user.plan)) {
      return;
    }

    createList(name.trim(), user.id, type);
    setName('');
    setType('personal');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create new list" description="Organize your tasks in a dedicated list.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="List name"
          placeholder="e.g. Project Alpha, Shopping, Q4 Goals..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('personal')}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer',
                type === 'personal'
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10'
                  : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
              )}
            >
              <Lock size={20} className={type === 'personal' ? 'text-violet-600' : 'text-zinc-400'} />
              <div>
                <p className={cn('text-sm font-medium', type === 'personal' ? 'text-violet-700 dark:text-violet-400' : 'text-zinc-700 dark:text-zinc-300')}>
                  Personal
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Only you</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setType('shared')}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer',
                type === 'shared'
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10'
                  : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
              )}
            >
              <List size={20} className={type === 'shared' ? 'text-violet-600' : 'text-zinc-400'} />
              <div>
                <p className={cn('text-sm font-medium', type === 'shared' ? 'text-violet-700 dark:text-violet-400' : 'text-zinc-700 dark:text-zinc-300')}>
                  Shared
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Collaborate</p>
              </div>
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim()}>
            Create list
          </Button>
        </div>
      </form>
    </Modal>
  );
}
