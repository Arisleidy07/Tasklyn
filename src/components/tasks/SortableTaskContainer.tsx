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
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? "transform 200ms ease",
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
    position: "relative",
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group/sortable">
      {/* Grip handle - only this triggers drag, keeps scroll free */}
      <div
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className={[
          "absolute left-0 top-0 bottom-0 w-7 z-10",
          "flex items-center justify-center",
          "opacity-0 group-hover/sortable:opacity-100",
          "cursor-grab active:cursor-grabbing",
          "touch-none select-none",
          "transition-opacity duration-150",
        ].join(" ")}
        style={{ borderRadius: "20px 0 0 20px" }}
        title="Mantén presionado para reorganizar"
      >
        <GripVertical
          size={14}
          style={{ color: "var(--text-tertiary)", pointerEvents: "none" }}
        />
      </div>
      {children}
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
    // Desktop: requires moving 8px before drag starts (prevents accidental drags on click)
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    // Mobile: requires holding 500ms + tolerates 10px of movement (allows scroll to work freely)
    useSensor(TouchSensor, {
      activationConstraint: { delay: 500, tolerance: 10 },
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
