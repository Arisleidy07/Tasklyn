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
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface DragHandleProps {
  /** Attach to the card wrapper element for position tracking */
  setNodeRef: (node: HTMLElement | null) => void;
  /** Attach to the card wrapper (a11y + listeners — whole-card long-press) */
  attributes: Record<string, unknown>;
  /** Attach to the entire card wrapper for whole-card long-press drag */
  listeners: Record<string, unknown> | undefined;
}

// ── SortableTaskItem ──────────────────────────────────────────────────────────
interface SortableTaskItemProps {
  task: Task;
  /** Render prop: receives drag handle props to place inside the card */
  children: (
    dragHandleProps: DragHandleProps,
    isDragging: boolean,
  ) => React.ReactNode;
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
    transition:
      transition ?? "transform 200ms cubic-bezier(0.25,0.46,0.45,0.94)",
    zIndex: isDragging ? 999 : undefined,
  };

  const dragHandleProps: DragHandleProps = {
    setNodeRef: (node: HTMLElement | null) => setNodeRef(node),
    attributes: attributes as unknown as Record<string, unknown>,
    listeners: listeners as unknown as Record<string, unknown> | undefined,
  };

  return <div style={style}>{children(dragHandleProps, isDragging)}</div>;
}

// ── SortableTaskContainer ─────────────────────────────────────────────────────
interface SortableTaskContainerProps {
  tasks: Task[];
  onReorder: (newOrder: Task[]) => void;
  children: (
    task: Task,
    dragHandleProps: DragHandleProps,
    isDragging: boolean,
  ) => React.ReactNode;
}

export function SortableTaskContainer({
  tasks,
  onReorder,
  children,
}: SortableTaskContainerProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    // Desktop: 8px movement to activate drag (no accidental drag on click)
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    // Mobile: listeners are on the grip handle (touchAction:none scoped there).
    // Hold grip 500ms to activate drag. tolerance:8 = cancel if finger drifts.
    useSensor(TouchSensor, {
      activationConstraint: { delay: 500, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      onReorder(arrayMove(tasks, oldIndex, newIndex));
    },
    [tasks, onReorder],
  );

  const handleDragCancel = useCallback(() => setActiveId(null), []);

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        {tasks.map((task) => (
          <SortableTaskItem key={task.id} task={task}>
            {(dragHandleProps, isDragging) =>
              children(task, dragHandleProps, isDragging)
            }
          </SortableTaskItem>
        ))}
      </SortableContext>

      {/* Drag overlay: floating ghost while dragging */}
      <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
        {activeTask ? (
          <div
            style={{
              opacity: 0.9,
              boxShadow: "0 16px 40px rgba(0,0,0,0.25)",
              borderRadius: "14px",
              transform: "rotate(1.5deg) scale(1.02)",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                borderRadius: "14px",
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                padding: "11px 14px",
              }}
            >
              <p
                style={{
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                {activeTask.title}
              </p>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
