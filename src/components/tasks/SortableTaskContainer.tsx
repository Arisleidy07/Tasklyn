"use client";

import React, { useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { Task } from "@/types";

// ── SortableTaskItem ──────────────────────────────────────────────────────────
interface SortableTaskItemProps {
  task: Task;
  children: React.ReactNode;
}

export function SortableTaskItem({ task, children }: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? "transform 200ms ease",
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
    position: "relative",
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        {...attributes}
        {...listeners}
        className="flex items-center gap-1 cursor-grab active:cursor-grabbing touch-none"
      >
        {/* Task content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}

// ── SortableTaskContainer ─────────────────────────────────────────────────────
interface SortableTaskContainerProps {
  tasks: Task[];
  onReorder: (newOrder: Task[]) => void;
  children: (task: Task) => React.ReactNode;
}

export function SortableTaskContainer({
  tasks,
  onReorder,
  children,
}: SortableTaskContainerProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      onReorder(arrayMove(tasks, oldIndex, newIndex));
    },
    [tasks, onReorder],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        {tasks.map((task) => children(task))}
      </SortableContext>
    </DndContext>
  );
}
