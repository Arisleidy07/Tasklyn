"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";
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
  DragMoveEvent,
  useDndContext,
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
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
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
  scrollContainerRef: externalScrollRef,
  children,
}: SortableTaskContainerProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const scrollContainerRef = externalScrollRef || useRef<HTMLDivElement>(null);
  const autoScrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const isTouchDevice = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(pointer: coarse)").matches;
  }, []);

  const sensorList = [
    // Desktop: PointerSensor with distance (drag immediately on move)
    !isTouchDevice
      ? useSensor(PointerSensor, {
          activationConstraint: {
            distance: 5,
          },
        })
      : null,
    // Mobile: PointerSensor with delay + tolerance (long-press behavior)
    isTouchDevice
      ? useSensor(PointerSensor, {
          activationConstraint: {
            delay: 500,
            tolerance: 5,
          },
        })
      : null,
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  ].filter(Boolean);

  const sensors = useSensors(...sensorList);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      const container = scrollContainerRef.current;
      if (!container || !activeId) return;

      const { delta } = event;
      const containerRect = container.getBoundingClientRect();
      const scrollThreshold = 80; // px from edge to trigger auto-scroll
      const scrollSpeed = 10; // px per scroll tick

      // Get pointer position from the activator event
      const activatorEvent = event.activatorEvent as
        | PointerEvent
        | MouseEvent
        | TouchEvent
        | null;
      if (!activatorEvent) return;

      let pointerY: number;
      if ("clientY" in activatorEvent) {
        pointerY = activatorEvent.clientY;
      } else if (
        "touches" in activatorEvent &&
        activatorEvent.touches.length > 0
      ) {
        pointerY = activatorEvent.touches[0].clientY;
      } else {
        return;
      }

      // Check if near top edge
      if (pointerY - containerRect.top < scrollThreshold) {
        if (!autoScrollIntervalRef.current) {
          autoScrollIntervalRef.current = setInterval(() => {
            container.scrollBy({ top: -scrollSpeed, behavior: "auto" });
          }, 16);
        }
      }
      // Check if near bottom edge
      else if (containerRect.bottom - pointerY < scrollThreshold) {
        if (!autoScrollIntervalRef.current) {
          autoScrollIntervalRef.current = setInterval(() => {
            container.scrollBy({ top: scrollSpeed, behavior: "auto" });
          }, 16);
        }
      }
      // Clear auto-scroll if not near edges
      else {
        if (autoScrollIntervalRef.current) {
          clearInterval(autoScrollIntervalRef.current);
          autoScrollIntervalRef.current = null;
        }
      }
    },
    [activeId],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      onReorder(arrayMove(tasks, oldIndex, newIndex));
    },
    [tasks, onReorder],
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  }, []);

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
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
