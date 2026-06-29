"use client";

import React, { useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  LongPressSensor,
  LONG_PRESS_CONSTRAINT,
  LONG_PRESS_DELAY,
} from "@/lib/LongPressSensor";
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
  /** Render prop: receives task, drag handle props, dragging state and a drag-click guard ref */
  children: (
    task: Task,
    dragHandleProps: DragHandleProps,
    isDragging: boolean,
    justDraggedRef: React.RefObject<boolean>,
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

  // Track long-press so the inevitable click after a drag does not open detail.
  const justDraggedRef = React.useRef(false);
  const longPressTimer = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const isLongPress = React.useRef(false);

  const handlePointerDown = React.useCallback(() => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
    }, LONG_PRESS_DELAY);
  }, []);

  const handlePointerUp = React.useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (isLongPress.current && !isDragging) {
      justDraggedRef.current = true;
      setTimeout(() => {
        justDraggedRef.current = false;
      }, 150);
    }
  }, [isDragging]);

  React.useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, []);

  return (
    <div
      style={style}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {children(task, dragHandleProps, isDragging, justDraggedRef)}
    </div>
  );
}

// ── SortableTaskContainer ─────────────────────────────────────────────────────
interface SortableTaskContainerProps {
  tasks: Task[];
  onReorder: (newOrder: Task[]) => void;
  children: (
    task: Task,
    dragHandleProps: DragHandleProps,
    isDragging: boolean,
    justDraggedRef: React.RefObject<boolean>,
  ) => React.ReactNode;
}

export function SortableTaskContainer({
  tasks,
  onReorder,
  children,
}: SortableTaskContainerProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    // PointerSensor with distance: 5 (drag immediately on move)
    // Works for both desktop and mobile like Microsoft To Do
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
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
            {(task, dragHandleProps, isDragging, justDraggedRef) =>
              children(task, dragHandleProps, isDragging, justDraggedRef)
            }
          </SortableTaskItem>
        ))}
      </SortableContext>

      {/* Drag overlay: floating ghost while dragging */}
      <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
        {activeTask ? (
          <div
            style={{
              opacity: 0.92,
              boxShadow: "var(--shadow-modal)",
              borderRadius: "var(--radius-md)",
              transform: "rotate(1deg) scale(1.01)",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                padding: "10px 12px",
              }}
            >
              <p
                style={{
                  color: "var(--text-primary)",
                  fontSize: "var(--text-base)",
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
