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
import { GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { useListStore } from "@/stores/listStore";
import type { TaskList } from "@/types";

// ── SortableListItem ──────────────────────────────────────────────────────────
interface SortableListItemProps {
  list: TaskList;
  index: number;
  total: number;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  children: React.ReactNode;
  showMoveButtons?: boolean;
}

export function SortableListItem({
  list,
  index,
  total,
  onMoveUp,
  onMoveDown,
  children,
  showMoveButtons = false,
}: SortableListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: list.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? "transform 200ms ease",
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
    position: "relative",
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="group/sortable flex items-center gap-1">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 opacity-0 group-hover/sortable:opacity-100 transition-opacity p-0.5 rounded cursor-grab active:cursor-grabbing touch-none"
          style={{ color: "var(--text-tertiary)" }}
          aria-label="Arrastrar para reordenar"
          tabIndex={-1}
        >
          <GripVertical size={14} />
        </button>

        {/* List content */}
        <div className="flex-1 min-w-0">{children}</div>

        {/* Up/Down fallback buttons (mobile & accessibility) */}
        {showMoveButtons && (
          <div className="flex-shrink-0 flex flex-col gap-0.5 opacity-0 group-hover/sortable:opacity-100 transition-opacity">
            <button
              onClick={() => onMoveUp(list.id)}
              disabled={index === 0}
              className="p-0.5 rounded transition-colors disabled:opacity-20"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--text-primary)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-tertiary)")
              }
              aria-label="Mover arriba"
            >
              <ChevronUp size={12} />
            </button>
            <button
              onClick={() => onMoveDown(list.id)}
              disabled={index === total - 1}
              className="p-0.5 rounded transition-colors disabled:opacity-20"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--text-primary)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-tertiary)")
              }
              aria-label="Mover abajo"
            >
              <ChevronDown size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── SortableListContainer ─────────────────────────────────────────────────────
interface SortableListContainerProps {
  lists: TaskList[];
  onReorder: (newOrder: TaskList[]) => void;
  showMoveButtons?: boolean;
  wrapperClassName?: string;
  children: (
    list: TaskList,
    index: number,
    total: number,
    moveUp: (id: string) => void,
    moveDown: (id: string) => void,
  ) => React.ReactNode;
}

export function SortableListContainer({
  lists,
  onReorder,
  showMoveButtons = false,
  wrapperClassName,
  children,
}: SortableListContainerProps) {
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
      const oldIndex = lists.findIndex((l) => l.id === active.id);
      const newIndex = lists.findIndex((l) => l.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      onReorder(arrayMove(lists, oldIndex, newIndex));
    },
    [lists, onReorder],
  );

  const moveUp = useCallback(
    (id: string) => {
      const index = lists.findIndex((l) => l.id === id);
      if (index <= 0) return;
      onReorder(arrayMove(lists, index, index - 1));
    },
    [lists, onReorder],
  );

  const moveDown = useCallback(
    (id: string) => {
      const index = lists.findIndex((l) => l.id === id);
      if (index >= lists.length - 1) return;
      onReorder(arrayMove(lists, index, index + 1));
    },
    [lists, onReorder],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={lists.map((l) => l.id)}
        strategy={verticalListSortingStrategy}
      >
        {wrapperClassName ? (
          <div className={wrapperClassName}>
            {lists.map((list, index) =>
              children(list, index, lists.length, moveUp, moveDown),
            )}
          </div>
        ) : (
          lists.map((list, index) =>
            children(list, index, lists.length, moveUp, moveDown),
          )
        )}
      </SortableContext>
    </DndContext>
  );
}

// ── Hook: useSortableLists ────────────────────────────────────────────────────
export function useSortableLists(initialLists: TaskList[]) {
  const { reorderLists } = useListStore();

  const handleReorder = useCallback(
    (newOrder: TaskList[]) => {
      reorderLists(newOrder.map((l) => l.id));
    },
    [reorderLists],
  );

  return { handleReorder };
}
