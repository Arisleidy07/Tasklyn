"use client";

// =====================================================
// EDIT LIST MODAL - VERSION PROFESIONAL
// =====================================================

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { TaskList, MemberRole, User, BgCategoryConfig } from "@/types";
import { useListStore } from "@/stores/listStore";
import { useAuthStore } from "@/stores/authStore";
import { getUserRole, canEditList } from "@/lib/permissions";
import {
  X,
  Check,
  Plus,
  Trash2,
  AlertTriangle,
  Download,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Settings2,
  Maximize2,
  Minimize2,
  FolderOpen,
  Move,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  subscribeToBackgrounds,
  deleteBackgroundImageDoc,
  subscribeToBgCategories,
  addBgCategory,
  updateBgCategory,
  deleteBgCategory,
  reorderBgCategories,
  updateBackgroundImage,
  reorderBackgroundImages,
  renameCategoryOnImages,
  moveImagesToCategoryBatch,
  deleteImagesByCategory,
  type BackgroundImage,
} from "@/lib/firestore";
import { deleteBackgroundImage } from "@/lib/storage";
import ImageUploadModal from "./ImageUploadModal";

interface EditListModalProps {
  list: TaskList;
  memberProfiles: Record<string, User>;
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_CATEGORIES: BgCategoryConfig[] = [
  {
    id: "default-1",
    name: "Personalizadas",
    emoji: "⭐",
    order: 0,
    createdBy: "system",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "default-2",
    name: "Naturaleza",
    emoji: "🌿",
    order: 1,
    createdBy: "system",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "default-3",
    name: "Paisajes",
    emoji: "🏔️",
    order: 2,
    createdBy: "system",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "default-4",
    name: "Ciudad",
    emoji: "🏙️",
    order: 3,
    createdBy: "system",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "default-5",
    name: "Abstracto",
    emoji: "🎨",
    order: 4,
    createdBy: "system",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// =====================================================
// EMOJI PICKER
// =====================================================

const EMOJI_CATEGORIES = [
  {
    name: "Trabajo",
    emojis: ["📁", "💼", "📊", "🖥️", "📅", "📎", "📌", "✏️", "📋", "📝"],
  },
  {
    name: "Casa",
    emojis: ["🏠", "🧹", "🛋️", "🪴", "🛏️", "🍳", "🧺", "🚪", "💡", "🧯"],
  },
  {
    name: "Compras",
    emojis: ["🛒", "🛍️", "🍎", "🥦", "🥛", "🍞", "🧴", "🧻", "🎁", "💳"],
  },
  {
    name: "Escuela",
    emojis: ["📚", "✏️", "🎓", "📝", "🖍️", "🎒", "📐", "🔬", "🌍", "📖"],
  },
  {
    name: "Salud",
    emojis: ["❤️", "💊", "🩺", "🏥", "🧘", "🥗", "💪", "🩹", "🧴", "🌡️"],
  },
  {
    name: "Viajes",
    emojis: ["✈️", "🚗", "🌎", "🏖️", "🗺️", "🧳", "🚢", "🚂", "🏕️", "📸"],
  },
  {
    name: "Finanzas",
    emojis: ["💰", "💳", "📈", "📉", "🏦", "🪙", "💵", "📊", "🧾", "🔒"],
  },
  {
    name: "Ocio",
    emojis: ["🎮", "🎬", "🎵", "🎨", "🎭", "⚽", "🏀", "🎲", "🧩", "🎸"],
  },
];

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-16 h-16 text-3xl flex items-center justify-center rounded-xl border-2 transition-all"
        style={{
          backgroundColor: "var(--bg-secondary)",
          borderColor: "var(--border-color)",
        }}
        aria-label="Seleccionar emoji"
      >
        {value || "📋"}
      </button>
      {open && (
        <div
          className="absolute z-50 top-full left-0 mt-2 w-[280px] max-h-[320px] overflow-y-auto rounded-xl p-3 shadow-[var(--shadow-modal)]"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-color)",
          }}
        >
          {EMOJI_CATEGORIES.map((cat) => (
            <div key={cat.name} className="mb-3">
              <p
                className="text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: "var(--text-tertiary)" }}
              >
                {cat.name}
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {cat.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      onChange(emoji);
                      setOpen(false);
                    }}
                    className="h-9 w-9 flex items-center justify-center text-xl rounded-lg transition-colors hover:bg-[var(--bg-secondary)]"
                    style={{
                      backgroundColor:
                        value === emoji ? "var(--bg-secondary)" : "transparent",
                    }}
                    aria-label={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =====================================================
// SORTABLE IMAGE ITEM
// =====================================================

interface SortableImageItemProps {
  image: BackgroundImage;
  isSelected: boolean;
  category: string;
  onSelect: (url: string) => void;
  onDownload: (url: string, displayName?: string) => void;
  onDelete: (image: BackgroundImage) => void;
  userId: string;
}

function SortableImageItem({
  image,
  isSelected,
  category,
  onSelect,
  onDownload,
  onDelete,
  userId,
}: SortableImageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 200ms ease",
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group select-none">
      <div
        onClick={() => !isDragging && onSelect(image.url)}
        className="relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer transition-all duration-200"
        style={
          isSelected
            ? {
                boxShadow:
                  "0 0 0 3px #3b82f6, 0 0 0 7px rgba(59,130,246,0.2), 0 12px 40px rgba(59,130,246,0.35)",
                transform: "scale(1.01)",
              }
            : undefined
        }
      >
        {/* Image */}
        <img
          src={image.url}
          alt={image.displayName || category}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Always-on bottom gradient for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

        {/* Selected state */}
        {isSelected && (
          <>
            <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-[0.5px] pointer-events-none" />
            <div className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shadow-xl ring-2 ring-white/60">
              <Check size={15} className="text-white" strokeWidth={3} />
            </div>
            <div className="absolute bottom-2.5 left-2.5">
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-blue-500 text-white"
                style={{ boxShadow: "0 4px 12px rgba(37,99,235,0.6)" }}
              >
                Activo
              </span>
            </div>
          </>
        )}

        {/* Hover overlay — name + actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col justify-between p-3">
          {/* Drag handle top-left */}
          <div className="flex justify-between items-start">
            <div
              {...attributes}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg cursor-grab active:cursor-grabbing touch-none"
              style={{
                backgroundColor: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(8px)",
                color: "#fff",
              }}
            >
              <GripVertical size={14} />
            </div>
          </div>

          {/* Bottom: name + actions */}
          <div className="space-y-1.5">
            {image.displayName && (
              <p className="text-xs font-semibold text-white truncate leading-none">
                {image.displayName}
              </p>
            )}
            <div className="flex gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(image.url, image.displayName);
                }}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold text-white transition-all hover:bg-white/25 active:scale-95"
                style={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <Download size={11} /> Descargar
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(image);
                }}
                className="flex items-center justify-center w-8 h-8 rounded-lg transition-all active:scale-95"
                style={{
                  backgroundColor: "rgba(239,68,68,0.85)",
                  backdropFilter: "blur(8px)",
                  color: "#fff",
                  boxShadow: "0 2px 8px rgba(239,68,68,0.5)",
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Non-selected hover ring */}
        {!isSelected && (
          <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent group-hover:ring-white/40 transition-all duration-200 pointer-events-none" />
        )}
      </div>
    </div>
  );
}

// =====================================================
// CATEGORY DROP ZONE — accepts images dragged into empty categories
// =====================================================

function CategoryDropZone({
  categoryId,
  categoryName,
  onUpload,
}: {
  categoryId: string;
  categoryName: string;
  onUpload: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `cat-drop-${categoryId}` });
  return (
    <div ref={setNodeRef} className="col-span-full">
      <button
        onClick={onUpload}
        className="w-full py-10 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-all duration-200"
        style={{
          borderColor: isOver ? "#3b82f6" : "var(--border-color)",
          backgroundColor: isOver ? "rgba(59,130,246,0.08)" : "transparent",
          color: isOver ? "#3b82f6" : "var(--text-tertiary)",
          transform: isOver ? "scale(1.01)" : "scale(1)",
        }}
      >
        <ImageIcon size={28} />
        <span className="text-sm font-medium">
          {isOver ? `Soltar aquí` : `Subir imágenes a ${categoryName}`}
        </span>
      </button>
    </div>
  );
}

// =====================================================
// SORTABLE CATEGORY ITEM
// =====================================================

interface SortableCategoryItemProps {
  category: BgCategoryConfig;
  index: number;
  isEditing: boolean;
  editDraft: { name: string; emoji: string };
  onEditChange: (field: "name" | "emoji", value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onStartEdit: () => void;
  onDelete: () => void;
}

function SortableCategoryItem({
  category,
  index,
  isEditing,
  editDraft,
  onEditChange,
  onSave,
  onCancel,
  onStartEdit,
  onDelete,
}: SortableCategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id, disabled: isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] group hover:border-blue-500/30 transition-all"
    >
      <button
        {...attributes}
        {...listeners}
        className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] cursor-grab active:cursor-grabbing transition-colors"
      >
        <GripVertical size={18} />
      </button>

      {isEditing ? (
        <input
          type="text"
          inputMode="text"
          value={editDraft.emoji}
          onChange={(e) => onEditChange("emoji", e.target.value)}
          className="w-12 h-12 text-center text-2xl bg-[var(--bg-primary)] border-2 border-[var(--border-color)] rounded-xl focus:outline-none focus:border-blue-500 transition-all"
          placeholder="📁"
        />
      ) : (
        <span className="w-12 h-12 flex items-center justify-center text-2xl bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)]">
          {category.emoji || "📁"}
        </span>
      )}

      {isEditing ? (
        <input
          type="text"
          value={editDraft.name}
          onChange={(e) => onEditChange("name", e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSave();
            if (e.key === "Escape") onCancel();
          }}
          className="flex-1 px-4 py-3 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-all"
          placeholder="Nombre de categoría"
          autoFocus
        />
      ) : (
        <span
          onClick={onStartEdit}
          className="flex-1 text-sm font-semibold text-[var(--text-primary)] cursor-pointer hover:text-blue-500 transition-colors px-2"
        >
          {category.name}
        </span>
      )}

      <span className="px-3 py-1 text-xs font-bold bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] rounded-full">
        {index + 1}
      </span>

      <div className="flex items-center gap-1">
        {isEditing ? (
          <>
            <button
              onClick={onSave}
              className="p-2 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
            >
              <Check size={18} />
            </button>
            <button
              onClick={onCancel}
              className="p-2 rounded-lg bg-gray-500/10 text-gray-600 hover:bg-gray-500/20 transition-colors"
            >
              <X size={18} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onStartEdit}
              className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] transition-colors"
              title="Editar categoría"
            >
              <Settings2 size={18} />
            </button>
            <button
              onClick={onDelete}
              className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
              title="Eliminar categoría"
            >
              <Trash2 size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// =====================================================
// MAIN EDIT LIST MODAL COMPONENT
// =====================================================

export default function EditListModal({
  list,
  memberProfiles,
  isOpen,
  onClose,
}: EditListModalProps) {
  // State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [name, setName] = useState(list.name);
  const [description, setDescription] = useState(list.description || "");
  const [color, setColor] = useState(list.color || "#2563eb");
  const [emoji, setEmoji] = useState(list.icon || "");
  const [isPublic, setIsPublic] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState(
    list.backgroundImage || "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [categories, setCategories] = useState<BgCategoryConfig[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );
  const [editDraft, setEditDraft] = useState<{ name: string; emoji: string }>({
    name: "",
    emoji: "",
  });
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryEmoji, setNewCategoryEmoji] = useState("📁");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [bgImages, setBgImages] = useState<BackgroundImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<BackgroundImage | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadModalCategory, setUploadModalCategory] =
    useState("Personalizadas");
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<BackgroundImage | null>(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<{
    id: string;
    name: string;
    imageCount: number;
  } | null>(null);
  const [deleteCategoryAction, setDeleteCategoryAction] = useState<
    "move" | "delete"
  >("move");
  const [deleteCategoryMoveTo, setDeleteCategoryMoveTo] = useState<string>("");
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const { updateList, removeMember, updateMemberRole, deleteList } =
    useListStore();
  const user = useAuthStore((s) => s.user);
  const myRole = getUserRole(list, user?.id || "");
  const canEdit = canEditList(myRole);
  const isOwner = list.owner === user?.id;

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Subscribe to categories — if empty, seed defaults into Firestore (real IDs)
  const seedingRef = useRef(false);
  useEffect(() => {
    if (!isOpen) return;
    setLoadingCategories(true);
    const unsubscribe = subscribeToBgCategories(async (cats) => {
      if (cats.length === 0 && !seedingRef.current) {
        seedingRef.current = true;
        try {
          for (const cat of DEFAULT_CATEGORIES) {
            await addBgCategory({
              name: cat.name,
              emoji: cat.emoji,
              order: cat.order,
              createdBy: "system",
            });
          }
        } catch (e) {
          console.error("Error seeding default categories:", e);
          seedingRef.current = false;
        }
        // snapshot will fire again with real docs
        return;
      }
      if (cats.length > 0) seedingRef.current = false;
      setCategories(cats.sort((a, b) => a.order - b.order));
      setLoadingCategories(false);
    });
    return () => unsubscribe();
  }, [isOpen]);

  // Subscribe to background images
  useEffect(() => {
    if (!isOpen) return;
    setLoadingImages(true);
    const unsubscribe = subscribeToBackgrounds((images) => {
      setBgImages(images);
      setLoadingImages(false);
    });
    return () => unsubscribe();
  }, [isOpen]);

  // Reset state on open and handle body scroll lock
  useEffect(() => {
    isMountedRef.current = true;
    if (isOpen) {
      setName(list.name);
      setDescription(list.description || "");
      setColor(list.color || "#2563eb");
      setEmoji(list.icon || "");
      setIsPublic(false);
      setBackgroundImage(list.backgroundImage || "");
      setSaved(false);
      setIsManagingCategories(false);
      // Lock body scroll
      document.body.style.overflow = "hidden";
    }
    return () => {
      isMountedRef.current = false;
      // Unlock body scroll when modal closes
      document.body.style.overflow = "";
    };
  }, [isOpen, list]);

  // Handlers
  const handleSelectBackground = async (url: string) => {
    const newUrl = backgroundImage === url ? "" : url;
    setBackgroundImage(newUrl);
    try {
      await updateList(list.id, {
        backgroundImage: newUrl || undefined,
      });
      setSaved(true);
      setTimeout(() => {
        if (isMountedRef.current) setSaved(false);
      }, 2000);
    } catch (e) {
      console.error("Error applying background:", e);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      const updates: Partial<
        Pick<
          TaskList,
          "name" | "description" | "color" | "icon" | "backgroundImage"
        >
      > = {
        name: name.trim(),
        description: description.trim(),
        color,
        icon: emoji.trim(),
      };
      // Only include backgroundImage if the user explicitly changed it in this session
      if (backgroundImage !== (list.backgroundImage || "")) {
        updates.backgroundImage = backgroundImage || undefined;
      }
      await updateList(list.id, updates);
      setSaved(true);
      setTimeout(() => {
        if (isMountedRef.current) {
          setSaved(false);
        }
      }, 2000);
    } catch (e) {
      console.error("Error saving list:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    await removeMember(list.id, userId);
  };
  const handleRoleChange = async (userId: string, newRole: MemberRole) => {
    await updateMemberRole(list.id, userId, newRole);
  };
  const handleDeleteList = async () => {
    if (!isOwner) return;
    if (confirm("¿Eliminar esta lista permanentemente?")) {
      await deleteList(list.id);
      onClose();
    }
  };

  // Category handlers
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const maxOrder =
        categories.length > 0
          ? Math.max(...categories.map((c) => c.order))
          : -1;
      await addBgCategory({
        name: newCategoryName.trim(),
        emoji: newCategoryEmoji,
        order: maxOrder + 1,
        createdBy: user!.id,
      });
      setNewCategoryName("");
      setNewCategoryEmoji("📁");
      setShowAddCategory(false);
    } catch (e) {
      console.error("Error adding category:", e);
    }
  };

  const handleUpdateCategory = async (id: string) => {
    if (!editDraft.name.trim()) return;
    const cat = categories.find((c) => c.id === id);
    const oldName = cat?.name || "";
    const newName = editDraft.name.trim();
    try {
      await updateBgCategory(id, { name: newName, emoji: editDraft.emoji });
      // Propagate rename to all images in this category
      if (oldName && oldName !== newName) {
        await renameCategoryOnImages(oldName, newName);
      }
      setEditingCategoryId(null);
    } catch (e) {
      console.error("Error updating category:", e);
    }
  };

  const handleDeleteCategory = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    // Count images directly from bgImages state (not groupedImages useMemo which may be stale)
    const imageCount = bgImages.filter(
      (img) => (img.category || "Personalizadas") === cat.name,
    ).length;
    const otherCats = categories.filter((c) => c.id !== id);
    setDeleteCategoryTarget({ id, name: cat.name, imageCount });
    setDeleteCategoryAction(imageCount > 0 ? "move" : "delete");
    setDeleteCategoryMoveTo(otherCats[0]?.name || "");
  };

  const handleConfirmDeleteCategory = async () => {
    if (!deleteCategoryTarget) return;
    setIsDeletingCategory(true);
    try {
      const { id, name, imageCount } = deleteCategoryTarget;
      if (imageCount > 0) {
        if (deleteCategoryAction === "move" && deleteCategoryMoveTo) {
          await moveImagesToCategoryBatch(name, deleteCategoryMoveTo);
        } else {
          await deleteImagesByCategory(name);
        }
      }
      await deleteBgCategory(id);
      // Optimistic: remove from local state immediately
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setDeleteCategoryTarget(null);
    } catch (e) {
      console.error("Error deleting category:", e);
      alert("Error al eliminar la categoría. Revisa la consola.");
    } finally {
      setIsDeletingCategory(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setCategories((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return items;
      const newItems = arrayMove(items, oldIndex, newIndex);
      // Only persist if all IDs are real Firestore IDs (not default-*)
      const allReal = newItems.every((c) => !c.id.startsWith("default-"));
      if (allReal) {
        reorderBgCategories(newItems.map((item) => item.id)).catch((e) => {
          console.error("Error reordering categories:", e);
        });
      }
      return newItems;
    });
  };

  // Image handlers
  const handleDeleteImage = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteBackgroundImageDoc(deleteTarget.id);
      if (backgroundImage === deleteTarget.url) setBackgroundImage("");
      setDeleteTarget(null);
    } catch (e) {
      console.error("Error deleting image:", e);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadImage = async (url: string, displayName?: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = displayName || `background-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (e) {
      console.error("Error downloading image:", e);
    }
  };

  const handleMoveImageToCategory = async (
    imageId: string,
    newCategory: string,
  ) => {
    try {
      await updateBackgroundImage(imageId, { category: newCategory });
    } catch (e) {
      console.error("Error moving image:", e);
    }
  };

  const openUploadModal = (categoryName: string) => {
    setUploadModalCategory(categoryName);
    setShowUploadModal(true);
  };

  const toggleCategory = (catName: string) => {
    setExpandedCategories((prev) => ({ ...prev, [catName]: !prev[catName] }));
  };

  // Image drag handlers
  const handleImageDragStart = (event: DragStartEvent) => {
    setActiveImageId(event.active.id as string);
    const image = bgImages.find((img) => img.id === event.active.id);
    setActiveImage(image || null);
  };

  const handleImageDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveImageId(null);
    setActiveImage(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const draggedImage = bgImages.find((img) => img.id === activeId);
    if (!draggedImage) return;

    // Check if dropping onto a category droppable zone (not an image)
    const overCategory = categories.find(
      (cat) => `cat-drop-${cat.id}` === overId,
    );
    if (overCategory) {
      if (draggedImage.category !== overCategory.name) {
        // Optimistic update
        setBgImages((prev) =>
          prev.map((img) =>
            img.id === activeId ? { ...img, category: overCategory.name } : img,
          ),
        );
        await handleMoveImageToCategory(activeId, overCategory.name);
      }
      return;
    }

    // Dropping onto another image
    const overImage = bgImages.find((img) => img.id === overId);
    if (!overImage) return;

    if (draggedImage.category !== overImage.category) {
      // Cross-category move: optimistic update
      setBgImages((prev) =>
        prev.map((img) =>
          img.id === activeId ? { ...img, category: overImage.category } : img,
        ),
      );
      await handleMoveImageToCategory(activeId, overImage.category);
    } else {
      // Reorder within same category
      const categoryImages = bgImages
        .filter((img) => img.category === draggedImage.category)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const oldIndex = categoryImages.findIndex((img) => img.id === activeId);
      const newIndex = categoryImages.findIndex((img) => img.id === overId);

      if (oldIndex !== newIndex) {
        const reordered = arrayMove(categoryImages, oldIndex, newIndex);
        // Optimistic update
        setBgImages((prev) => {
          const others = prev.filter(
            (img) => img.category !== draggedImage.category,
          );
          return [
            ...others,
            ...reordered.map((img, i) => ({ ...img, order: i })),
          ];
        });
        await reorderBackgroundImages(
          reordered.map((img, index) => ({ id: img.id, order: index })),
        );
      }
    }
  };

  // Grouped images
  const groupedImages = useMemo(() => {
    const grouped: Record<string, BackgroundImage[]> = {};
    categories.forEach((cat) => {
      grouped[cat.name] = [];
    });
    bgImages.forEach((img) => {
      const catName = img.category || "Personalizadas";
      if (!grouped[catName]) grouped[catName] = [];
      grouped[catName].push(img);
    });
    return grouped;
  }, [bgImages, categories]);

  if (!isOpen || !user) return null;

  const colors = [
    "#ef4444",
    "#f97316",
    "#f59e0b",
    "#eab308",
    "#84cc16",
    "#22c55e",
    "#10b981",
    "#14b8a6",
    "#06b6d4",
    "#0ea5e9",
    "#3b82f6",
    "#6366f1",
    "#8b5cf6",
    "#a855f7",
    "#d946ef",
    "#ec4899",
    "#f43f5e",
    "#78716c",
    "#6b7280",
    "#1f2937",
  ];

  // ==================== RENDER ====================
  return createPortal(
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9990] bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="fixed inset-0 z-[9991] flex items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex flex-col overflow-hidden shadow-2xl"
            style={{
              width: isFullscreen ? "100vw" : "100%",
              height: isFullscreen ? "100vh" : "100%",
              maxWidth: isFullscreen ? "none" : "min(96vw, 1440px)",
              maxHeight: isFullscreen ? "none" : "min(96vh, 960px)",
              backgroundColor: "var(--bg-card)",
              borderRadius: isFullscreen ? 0 : "28px",
              border: isFullscreen ? "none" : "1px solid var(--border-color)",
              boxShadow: isFullscreen
                ? "none"
                : "0 32px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)",
            }}
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-card)]">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                Editar lista
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition-colors hidden sm:flex"
                >
                  {isFullscreen ? (
                    <Minimize2 size={20} />
                  ) : (
                    <Maximize2 size={20} />
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
              <div className="p-6 md:p-8">
                {/* DETAILS SECTION */}
                {
                  <div className="max-w-4xl mx-auto space-y-6">
                    {/* Two-column grid: name/description | emoji/color */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left column */}
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-[var(--text-primary)]">
                            Nombre
                          </label>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-[var(--bg-secondary)] border-2 border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-input-focus)] transition-all"
                            placeholder="Mi Lista"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-[var(--text-primary)]">
                            Descripción
                          </label>
                          <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 bg-[var(--bg-secondary)] border-2 border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-input-focus)] transition-all resize-none"
                            placeholder="Describe el propósito..."
                          />
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-[var(--bg-secondary)] rounded-xl">
                          <input
                            type="checkbox"
                            id="isPublic"
                            checked={isPublic}
                            onChange={(e) => setIsPublic(e.target.checked)}
                            className="w-5 h-5 rounded border-[var(--border-color)] text-[var(--text-info)] focus:ring-[var(--border-input-focus)]"
                          />
                          <label
                            htmlFor="isPublic"
                            className="text-sm font-medium text-[var(--text-primary)] cursor-pointer"
                          >
                            Lista pública
                          </label>
                        </div>
                      </div>

                      {/* Right column */}
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-[var(--text-primary)]">
                            Emoji
                          </label>
                          <div className="flex items-center gap-3">
                            <EmojiPicker value={emoji} onChange={setEmoji} />
                            <span className="text-sm text-[var(--text-secondary)]">
                              Pulsa para elegir
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-[var(--text-primary)]">
                            Color
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {colors.map((c) => (
                              <button
                                key={c}
                                onClick={() => setColor(c)}
                                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition-all ${color === c ? "ring-2 ring-offset-2 ring-[var(--border-input-focus)] scale-110" : "hover:scale-105"}`}
                                style={{ backgroundColor: c }}
                                aria-label={`Color ${c}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                }

                {/* BACKGROUNDS TAB — PREMIUM */}
                {/* BACKGROUNDS SECTION */}
                {
                  <div className="space-y-8 pb-4">
                    {/* ── ACTIVE BACKGROUND HERO ── */}
                    {backgroundImage ? (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative rounded-2xl overflow-hidden w-full border-2 shadow-lg"
                        style={{
                          borderColor: "var(--border-color)",
                          backgroundColor: "var(--bg-secondary)",
                          boxShadow: "var(--shadow-card)",
                          maxHeight: 420,
                        }}
                      >
                        <img
                          src={backgroundImage}
                          alt="Fondo activo"
                          className="w-full h-auto object-contain"
                          style={{ maxHeight: 420 }}
                        />
                        <div className="absolute top-3 left-3">
                          <span
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest text-white"
                            style={{
                              backgroundColor: "var(--text-success)",
                              boxShadow: "var(--shadow-sm)",
                            }}
                          >
                            <Check size={10} strokeWidth={3} /> Fondo activo
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            handleSelectBackground(backgroundImage)
                          }
                          className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all hover:scale-105 active:scale-95"
                          style={{
                            backgroundColor: "var(--text-error)",
                            boxShadow: "var(--shadow-sm)",
                          }}
                        >
                          <X size={13} /> Quitar
                        </button>
                      </motion.div>
                    ) : (
                      <div
                        className="relative rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-5 py-20 overflow-hidden"
                        style={{
                          borderColor: "var(--border-color)",
                          backgroundColor: "var(--bg-secondary)",
                        }}
                      >
                        <div
                          className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl"
                          style={{
                            background:
                              "linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(139,92,246,0.15) 100%)",
                          }}
                        >
                          <ImageIcon size={34} className="text-blue-400" />
                        </div>
                        <div className="text-center space-y-1.5">
                          <p
                            className="font-bold text-lg"
                            style={{ color: "var(--text-primary)" }}
                          >
                            Sin fondo seleccionado
                          </p>
                          <p
                            className="text-sm"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            Elige una imagen de la galería o sube la tuya
                          </p>
                        </div>
                        <button
                          onClick={() => openUploadModal("Personalizadas")}
                          className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                        >
                          <Plus size={16} /> Subir imagen
                        </button>
                      </div>
                    )}

                    {/* ── TOOLBAR ── */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <p
                        className="text-[11px] font-bold uppercase tracking-widest"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        Galería · {bgImages.length}{" "}
                        {bgImages.length === 1 ? "imagen" : "imágenes"}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openUploadModal("Personalizadas")}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm hover:shadow-md active:scale-95"
                        >
                          <Plus size={14} /> Subir
                        </button>
                        <button
                          onClick={() => setIsManagingCategories((v) => !v)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border-2"
                          style={{
                            borderColor: isManagingCategories
                              ? "#3b82f6"
                              : "var(--border-color)",
                            backgroundColor: isManagingCategories
                              ? "rgba(59,130,246,0.08)"
                              : "transparent",
                            color: isManagingCategories
                              ? "#3b82f6"
                              : "var(--text-secondary)",
                          }}
                        >
                          <Settings2 size={14} />
                          <span className="hidden sm:inline">Categorías</span>
                        </button>
                      </div>
                    </div>

                    {/* ── CATEGORY MANAGER (collapsible) ── */}
                    <AnimatePresence>
                      {isManagingCategories && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.22 }}
                          className="overflow-hidden"
                        >
                          <div
                            className="rounded-3xl border-2 p-5 space-y-3"
                            style={{
                              borderColor: "rgba(59,130,246,0.3)",
                              backgroundColor: "rgba(59,130,246,0.04)",
                            }}
                          >
                            <p className="text-[11px] font-bold uppercase tracking-widest text-blue-500">
                              Gestión de categorías
                            </p>
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={handleDragEnd}
                            >
                              <SortableContext
                                items={categories.map((c) => c.id)}
                                strategy={verticalListSortingStrategy}
                              >
                                <div className="space-y-2">
                                  {categories.map((cat, index) => (
                                    <SortableCategoryItem
                                      key={cat.id}
                                      category={cat}
                                      index={index}
                                      isEditing={editingCategoryId === cat.id}
                                      editDraft={editDraft}
                                      onEditChange={(field, value) =>
                                        setEditDraft((prev) => ({
                                          ...prev,
                                          [field]: value,
                                        }))
                                      }
                                      onSave={() =>
                                        handleUpdateCategory(cat.id)
                                      }
                                      onCancel={() =>
                                        setEditingCategoryId(null)
                                      }
                                      onStartEdit={() => {
                                        setEditingCategoryId(cat.id);
                                        setEditDraft({
                                          name: cat.name,
                                          emoji: cat.emoji || "📁",
                                        });
                                      }}
                                      onDelete={() =>
                                        handleDeleteCategory(cat.id)
                                      }
                                    />
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                            {showAddCategory ? (
                              <div
                                className="flex items-center gap-2 p-3 rounded-2xl border-2 border-blue-500/30"
                                style={{ backgroundColor: "var(--bg-card)" }}
                              >
                                <input
                                  type="text"
                                  value={newCategoryEmoji}
                                  onChange={(e) =>
                                    setNewCategoryEmoji(e.target.value)
                                  }
                                  className="w-12 h-12 text-center text-2xl rounded-xl focus:outline-none border-2 focus:border-blue-500 transition-colors"
                                  style={{
                                    backgroundColor: "var(--bg-secondary)",
                                    borderColor: "var(--border-color)",
                                  }}
                                  placeholder="📁"
                                />
                                <input
                                  type="text"
                                  value={newCategoryName}
                                  onChange={(e) =>
                                    setNewCategoryName(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleAddCategory();
                                    if (e.key === "Escape")
                                      setShowAddCategory(false);
                                  }}
                                  className="flex-1 px-4 py-3 rounded-xl text-sm font-medium focus:outline-none border-2 focus:border-blue-500 transition-colors"
                                  style={{
                                    backgroundColor: "var(--bg-secondary)",
                                    borderColor: "var(--border-color)",
                                    color: "var(--text-primary)",
                                  }}
                                  placeholder="Nombre de categoría..."
                                  autoFocus
                                />
                                <button
                                  onClick={handleAddCategory}
                                  className="p-2.5 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors"
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  onClick={() => setShowAddCategory(false)}
                                  className="p-2.5 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors"
                                  style={{ color: "var(--text-secondary)" }}
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowAddCategory(true)}
                                className="w-full py-3 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-sm font-semibold transition-all hover:border-blue-500 hover:text-blue-500 hover:bg-blue-500/5"
                                style={{
                                  borderColor: "var(--border-color)",
                                  color: "var(--text-tertiary)",
                                }}
                              >
                                <Plus size={15} /> Nueva categoría
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* ── IMAGE GALLERY — single global DndContext ── */}
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragStart={handleImageDragStart}
                      onDragEnd={handleImageDragEnd}
                    >
                      <div className="space-y-10">
                        {/* Skeleton while loading */}
                        {loadingImages ? (
                          <div className="space-y-8">
                            {[1, 2].map((s) => (
                              <div key={s} className="space-y-4">
                                <div
                                  className="h-6 w-36 rounded-xl animate-pulse"
                                  style={{
                                    backgroundColor: "var(--bg-tertiary)",
                                  }}
                                />
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                  {[1, 2, 3, 4].map((i) => (
                                    <div
                                      key={i}
                                      className="aspect-[4/3] rounded-2xl animate-pulse"
                                      style={{
                                        backgroundColor: "var(--bg-tertiary)",
                                      }}
                                    />
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : categories.length === 0 ? (
                          <div
                            className="flex flex-col items-center justify-center gap-5 py-24 rounded-3xl border-2 border-dashed"
                            style={{
                              borderColor: "var(--border-color)",
                              backgroundColor: "var(--bg-secondary)",
                            }}
                          >
                            <div
                              className="w-18 h-18 rounded-3xl flex items-center justify-center p-5"
                              style={{
                                background:
                                  "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.12))",
                              }}
                            >
                              <FolderOpen size={32} className="text-blue-400" />
                            </div>
                            <div className="text-center">
                              <p
                                className="font-bold text-lg"
                                style={{ color: "var(--text-primary)" }}
                              >
                                Sin categorías
                              </p>
                              <p
                                className="text-sm mt-1"
                                style={{ color: "var(--text-tertiary)" }}
                              >
                                Crea categorías para organizar tus fondos
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setIsManagingCategories(true);
                                setShowAddCategory(true);
                              }}
                              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 transition-all"
                            >
                              <Plus size={15} /> Crear categoría
                            </button>
                          </div>
                        ) : (
                          categories.map((category) => {
                            const images = (groupedImages[category.name] || [])
                              .slice()
                              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                            const isExpanded =
                              expandedCategories[category.name] ?? true;
                            const hasActive = images.some(
                              (img) => img.url === backgroundImage,
                            );
                            return (
                              <div key={category.id}>
                                {/* Category header */}
                                <div className="flex items-center justify-between mb-5">
                                  <button
                                    onClick={() =>
                                      toggleCategory(category.name)
                                    }
                                    className="flex items-center gap-3 min-w-0 group"
                                  >
                                    <span className="text-2xl leading-none flex-shrink-0">
                                      {category.emoji}
                                    </span>
                                    <span
                                      className="font-bold text-base truncate"
                                      style={{ color: "var(--text-primary)" }}
                                    >
                                      {category.name}
                                    </span>
                                    {images.length > 0 && (
                                      <span
                                        className="flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold"
                                        style={{
                                          backgroundColor: "var(--bg-tertiary)",
                                          color: "var(--text-tertiary)",
                                        }}
                                      >
                                        {images.length}
                                      </span>
                                    )}
                                    {hasActive && (
                                      <span className="flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold text-blue-600 bg-blue-500/10">
                                        ✓ activo
                                      </span>
                                    )}
                                    <span className="flex-shrink-0 text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors">
                                      {isExpanded ? (
                                        <ChevronUp size={15} />
                                      ) : (
                                        <ChevronDown size={15} />
                                      )}
                                    </span>
                                  </button>
                                  <button
                                    onClick={() =>
                                      openUploadModal(category.name)
                                    }
                                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95"
                                    style={{
                                      backgroundColor: "rgba(37,99,235,0.1)",
                                      color: "#2563eb",
                                    }}
                                  >
                                    <Plus size={13} /> Subir
                                  </button>
                                </div>

                                {/* Image grid */}
                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.18 }}
                                      className="overflow-hidden"
                                    >
                                      <SortableContext
                                        items={images.map((img) => img.id)}
                                        strategy={horizontalListSortingStrategy}
                                      >
                                        {images.length === 0 ? (
                                          <CategoryDropZone
                                            categoryId={category.id}
                                            categoryName={category.name}
                                            onUpload={() =>
                                              openUploadModal(category.name)
                                            }
                                          />
                                        ) : (
                                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                                            {images.map((img) => (
                                              <SortableImageItem
                                                key={img.id}
                                                image={img}
                                                isSelected={
                                                  backgroundImage === img.url
                                                }
                                                category={category.name}
                                                onSelect={
                                                  handleSelectBackground
                                                }
                                                onDownload={handleDownloadImage}
                                                onDelete={setDeleteTarget}
                                                userId={user!.id}
                                              />
                                            ))}
                                            <button
                                              onClick={() =>
                                                openUploadModal(category.name)
                                              }
                                              className="aspect-[4/3] flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed transition-all group"
                                              style={{
                                                borderColor:
                                                  "var(--border-color)",
                                              }}
                                              onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor =
                                                  "#3b82f6";
                                                e.currentTarget.style.backgroundColor =
                                                  "rgba(59,130,246,0.05)";
                                              }}
                                              onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor =
                                                  "var(--border-color)";
                                                e.currentTarget.style.backgroundColor =
                                                  "transparent";
                                              }}
                                            >
                                              <Plus
                                                size={22}
                                                className="text-[var(--text-tertiary)] group-hover:text-blue-500 transition-colors"
                                              />
                                              <span className="text-xs font-medium text-[var(--text-tertiary)] group-hover:text-blue-500 transition-colors">
                                                Agregar
                                              </span>
                                            </button>
                                          </div>
                                        )}
                                      </SortableContext>
                                      <div
                                        className="mt-8 border-t"
                                        style={{
                                          borderColor: "var(--border-color)",
                                        }}
                                      />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Global DragOverlay */}
                      <DragOverlay
                        dropAnimation={{
                          duration: 180,
                          easing: "cubic-bezier(0.18,0.67,0.6,1.22)",
                        }}
                      >
                        {activeImage && (
                          <div
                            className="rounded-2xl overflow-hidden ring-4 ring-blue-500"
                            style={{
                              width: 180,
                              aspectRatio: "4/3",
                              transform: "rotate(2.5deg) scale(1.06)",
                              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                            }}
                          >
                            <img
                              src={activeImage.url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </DragOverlay>
                    </DndContext>
                  </div>
                }
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 flex items-center justify-between gap-3 px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-card)]">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl text-sm font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!name.trim() || isSaving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 min-w-[140px] justify-center"
                style={{
                  backgroundColor: saved ? "#16a34a" : "#2563eb",
                  color: "#fff",
                }}
              >
                {saved ? <Check size={16} /> : null}
                {isSaving
                  ? "Guardando..."
                  : saved
                    ? "Guardado ✓"
                    : "Guardar cambios"}
              </button>
            </div>

            {/* Image Upload Modal */}
            <ImageUploadModal
              isOpen={showUploadModal}
              onClose={() => setShowUploadModal(false)}
              defaultCategory={uploadModalCategory}
              availableCategories={categories.map((c) => c.name)}
              user={user!}
              onUploaded={(url) => handleSelectBackground(url)}
            />

            {/* Delete Category Confirmation Modal */}
            <AnimatePresence>
              {deleteCategoryTarget && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[99998] bg-black/70 backdrop-blur-sm"
                    onClick={() =>
                      !isDeletingCategory && setDeleteCategoryTarget(null)
                    }
                  />
                  <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 12 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 12 }}
                      className="w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
                      style={{
                        backgroundColor: "var(--bg-card)",
                        border: "1px solid rgba(239,68,68,0.25)",
                      }}
                    >
                      <div className="p-6">
                        <div className="flex items-start gap-4 mb-5">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-red-500/10 flex-shrink-0">
                            <AlertTriangle size={22} className="text-red-500" />
                          </div>
                          <div>
                            <p
                              className="font-bold text-base"
                              style={{ color: "var(--text-primary)" }}
                            >
                              Eliminar categoría "{deleteCategoryTarget.name}"
                            </p>
                            {deleteCategoryTarget.imageCount > 0 ? (
                              <p
                                className="text-sm mt-1"
                                style={{ color: "var(--text-secondary)" }}
                              >
                                Esta categoría contiene{" "}
                                <strong>
                                  {deleteCategoryTarget.imageCount}
                                </strong>{" "}
                                imagen
                                {deleteCategoryTarget.imageCount !== 1
                                  ? "es"
                                  : ""}
                                . ¿Qué deseas hacer con ellas?
                              </p>
                            ) : (
                              <p
                                className="text-sm mt-1"
                                style={{ color: "var(--text-secondary)" }}
                              >
                                La categoría está vacía. Se eliminará sin
                                afectar imágenes.
                              </p>
                            )}
                          </div>
                        </div>

                        {deleteCategoryTarget.imageCount > 0 && (
                          <div className="space-y-2 mb-5">
                            {/* Option: Move */}
                            <label
                              className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${deleteCategoryAction === "move" ? "border-blue-500 bg-blue-500/5" : "border-transparent"}`}
                              style={{
                                backgroundColor:
                                  deleteCategoryAction === "move"
                                    ? undefined
                                    : "var(--bg-secondary)",
                              }}
                              onClick={() => setDeleteCategoryAction("move")}
                            >
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${deleteCategoryAction === "move" ? "border-blue-500 bg-blue-500" : "border-[var(--border-color)]"}`}
                              >
                                {deleteCategoryAction === "move" && (
                                  <Check
                                    size={11}
                                    className="text-white"
                                    strokeWidth={3}
                                  />
                                )}
                              </div>
                              <div>
                                <p
                                  className="font-semibold text-sm"
                                  style={{ color: "var(--text-primary)" }}
                                >
                                  Mover imágenes a otra categoría
                                </p>
                                {deleteCategoryAction === "move" && (
                                  <select
                                    value={deleteCategoryMoveTo}
                                    onChange={(e) =>
                                      setDeleteCategoryMoveTo(e.target.value)
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    className="mt-2 w-full px-3 py-2 rounded-xl text-sm border-2 focus:outline-none focus:border-blue-500"
                                    style={{
                                      backgroundColor: "var(--bg-secondary)",
                                      borderColor: "var(--border-color)",
                                      color: "var(--text-primary)",
                                    }}
                                  >
                                    {categories
                                      .filter(
                                        (c) => c.id !== deleteCategoryTarget.id,
                                      )
                                      .map((c) => (
                                        <option key={c.id} value={c.name}>
                                          {c.emoji} {c.name}
                                        </option>
                                      ))}
                                  </select>
                                )}
                              </div>
                            </label>
                            {/* Option: Delete */}
                            <label
                              className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${deleteCategoryAction === "delete" ? "border-red-500 bg-red-500/5" : "border-transparent"}`}
                              style={{
                                backgroundColor:
                                  deleteCategoryAction === "delete"
                                    ? undefined
                                    : "var(--bg-secondary)",
                              }}
                              onClick={() => setDeleteCategoryAction("delete")}
                            >
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${deleteCategoryAction === "delete" ? "border-red-500 bg-red-500" : "border-[var(--border-color)]"}`}
                              >
                                {deleteCategoryAction === "delete" && (
                                  <Check
                                    size={11}
                                    className="text-white"
                                    strokeWidth={3}
                                  />
                                )}
                              </div>
                              <div>
                                <p
                                  className="font-semibold text-sm"
                                  style={{ color: "var(--text-primary)" }}
                                >
                                  Eliminar imágenes también
                                </p>
                                <p className="text-xs mt-0.5 text-red-500">
                                  Esta acción no se puede deshacer
                                </p>
                              </div>
                            </label>
                          </div>
                        )}

                        <div className="flex gap-3">
                          <button
                            onClick={() => setDeleteCategoryTarget(null)}
                            disabled={isDeletingCategory}
                            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
                            style={{
                              backgroundColor: "var(--bg-secondary)",
                              color: "var(--text-secondary)",
                            }}
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={handleConfirmDeleteCategory}
                            disabled={
                              isDeletingCategory ||
                              (deleteCategoryTarget.imageCount > 0 &&
                                deleteCategoryAction === "move" &&
                                !deleteCategoryMoveTo)
                            }
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {isDeletingCategory ? (
                              <span className="animate-spin">⟳</span>
                            ) : (
                              <Trash2 size={14} />
                            )}
                            {isDeletingCategory
                              ? "Eliminando..."
                              : "Eliminar categoría"}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </>
              )}
            </AnimatePresence>

            {/* Delete Image Confirmation */}
            <AnimatePresence>
              {deleteTarget && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[99998] bg-black/60 backdrop-blur-sm"
                    onClick={() => !isDeleting && setDeleteTarget(null)}
                  />
                  <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
                      style={{
                        backgroundColor: "var(--bg-card)",
                        border: "1px solid rgba(239,68,68,0.2)",
                      }}
                    >
                      <div className="p-5">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/10">
                            <AlertTriangle size={18} className="text-red-500" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">
                              ¿Eliminar imagen?
                            </p>
                            <p className="text-xs text-[var(--text-tertiary)]">
                              No se puede deshacer.
                            </p>
                          </div>
                        </div>
                        <div className="w-full rounded-xl overflow-hidden mb-4 border border-[var(--border-color)] bg-[var(--bg-secondary)]">
                          <img
                            src={deleteTarget.url}
                            alt=""
                            className="w-full h-32 object-contain"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setDeleteTarget(null)}
                            disabled={isDeleting}
                            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={handleDeleteImage}
                            disabled={isDeleting}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white flex items-center justify-center gap-2"
                          >
                            {isDeleting ? (
                              <span className="animate-spin">⟳</span>
                            ) : (
                              <Trash2 size={14} />
                            )}{" "}
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </>
    </AnimatePresence>,
    document.body,
  );
}
