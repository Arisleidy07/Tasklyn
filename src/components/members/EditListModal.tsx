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
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS, Transform } from "@dnd-kit/utilities";
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
  type BackgroundImage,
} from "@/lib/firestore";
import { deleteBackgroundImage } from "@/lib/storage";
import ImageUploadModal from "./ImageUploadModal";

interface EditListModalProps {
  list: TaskList;
  memberProfiles: Record<string, User>;
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "details" | "members";
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div
        onClick={() => onSelect(isSelected ? "" : image.url)}
        className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${isSelected ? "border-blue-500 ring-2 ring-blue-500/30" : "border-[var(--border-color)] hover:border-blue-500/50"}`}
      >
        <img
          src={image.url}
          alt={image.displayName || category}
          className="w-full h-full object-contain bg-[var(--bg-secondary)]"
        />
        {isSelected && (
          <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
              <Check size={20} className="text-white" />
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3 gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload(image.url, image.displayName);
            }}
            className="p-2 rounded-lg bg-white/90 text-blue-600 hover:bg-white transition-colors"
          >
            <Download size={16} />
          </button>
          {image.uploadedBy === userId && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(image);
              }}
              className="p-2 rounded-lg bg-red-500/90 text-white hover:bg-red-500 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 p-2 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity"
        >
          <GripVertical size={16} />
        </div>
      </div>
      {image.displayName && (
        <p className="mt-1 text-xs text-center text-[var(--text-tertiary)] truncate">
          {image.displayName}
        </p>
      )}
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
  defaultTab = "details",
}: EditListModalProps) {
  // State
  const [activeTab, setActiveTab] = useState<
    "details" | "members" | "backgrounds"
  >(defaultTab);
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

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const { updateList, removeMember, updateMemberRole, deleteList } =
    useListStore();
  const user = useAuthStore((s) => s.user);
  const myRole = getUserRole(list, user?.id || "");
  const canEdit = canEditList(myRole);
  const isOwner = list.owner === user?.id;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Subscribe to categories
  useEffect(() => {
    if (!isOpen) return;
    setLoadingCategories(true);
    const unsubscribe = subscribeToBgCategories((cats) => {
      setCategories(
        cats.length === 0
          ? DEFAULT_CATEGORIES
          : cats.sort((a, b) => a.order - b.order),
      );
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
      setActiveTab(defaultTab);
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
  }, [isOpen, list, defaultTab]);

  // Handlers
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
    try {
      await updateBgCategory(id, {
        name: editDraft.name.trim(),
        emoji: editDraft.emoji,
      });
      setEditingCategoryId(null);
    } catch (e) {
      console.error("Error updating category:", e);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (
      !confirm(
        "¿Eliminar esta categoría? Las imágenes quedarán sin categorizar.",
      )
    )
      return;
    try {
      await deleteBgCategory(id);
    } catch (e) {
      console.error("Error deleting category:", e);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCategories((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        reorderBgCategories(newItems.map((item) => item.id)).catch(
          console.error,
        );
        return newItems;
      });
    }
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

    const activeImage = bgImages.find((img) => img.id === activeId);
    const overImage = bgImages.find((img) => img.id === overId);

    if (!activeImage || !overImage) return;

    // Check if dropping on a different category
    if (activeImage.category !== overImage.category) {
      // Move to new category
      await handleMoveImageToCategory(activeId, overImage.category);
    } else {
      // Reorder within same category
      const categoryImages = groupedImages[activeImage.category] || [];
      const oldIndex = categoryImages.findIndex((img) => img.id === activeId);
      const newIndex = categoryImages.findIndex((img) => img.id === overId);

      if (oldIndex !== newIndex) {
        const reordered = arrayMove(categoryImages, oldIndex, newIndex);
        const updates = reordered.map((img, index) => ({
          id: img.id,
          order: index,
        }));
        await reorderBackgroundImages(updates);
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
              maxWidth: isFullscreen ? "none" : "min(95vw, 1400px)",
              maxHeight: isFullscreen ? "none" : "min(95vh, 900px)",
              backgroundColor: "var(--bg-card)",
              borderRadius: isFullscreen ? 0 : "24px",
              border: isFullscreen ? "none" : "1px solid var(--border-color)",
            }}
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-card)]">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  Editar Lista
                </h2>
                <div className="flex items-center gap-1 p-1 bg-[var(--bg-secondary)] rounded-xl">
                  {[
                    { id: "details", label: "Detalles", icon: Settings2 },
                    { id: "members", label: "Miembros", icon: FolderOpen },
                    { id: "backgrounds", label: "Fondos", icon: ImageIcon },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? "bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
                    >
                      <tab.icon size={16} />{" "}
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>
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
              <div className="p-6">
                {/* DETAILS TAB */}
                {activeTab === "details" && (
                  <div className="max-w-2xl mx-auto space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[var(--text-primary)]">
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 bg-[var(--bg-secondary)] border-2 border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-all"
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
                        className="w-full px-4 py-3 bg-[var(--bg-secondary)] border-2 border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-all resize-none"
                        placeholder="Describe el propósito..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[var(--text-primary)]">
                        Emoji
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={emoji}
                          onChange={(e) => setEmoji(e.target.value)}
                          className="w-16 h-16 text-center text-3xl bg-[var(--bg-secondary)] border-2 border-[var(--border-color)] rounded-xl focus:outline-none focus:border-blue-500 transition-all"
                          placeholder="📋"
                        />
                        <span className="text-sm text-[var(--text-secondary)]">
                          Cualquier emoji del sistema
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
                            className={`w-10 h-10 rounded-xl transition-all ${color === c ? "ring-2 ring-offset-2 ring-blue-500 scale-110" : "hover:scale-105"}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-[var(--bg-secondary)] rounded-xl">
                      <input
                        type="checkbox"
                        id="isPublic"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        className="w-5 h-5 rounded border-[var(--border-color)] text-blue-500 focus:ring-blue-500"
                      />
                      <label
                        htmlFor="isPublic"
                        className="text-sm font-medium text-[var(--text-primary)] cursor-pointer"
                      >
                        Lista pública
                      </label>
                    </div>
                    {backgroundImage && (
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-[var(--text-primary)]">
                          Fondo activo
                        </label>
                        <div className="relative rounded-xl overflow-hidden border-2 border-blue-500/50 shadow-lg">
                          <img
                            src={backgroundImage}
                            alt="Fondo"
                            className="w-full h-48 object-contain bg-[var(--bg-secondary)]"
                          />
                          <div className="absolute top-3 left-3 px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                            ✓ FONDO ACTIVO
                          </div>
                          <button
                            onClick={() => setBackgroundImage("")}
                            className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-red-500 text-white rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* MEMBERS TAB */}
                {activeTab === "members" && (
                  <div className="max-w-2xl mx-auto">
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">
                      Miembros ({list.members?.length || 0})
                    </h3>
                    <div className="space-y-3">
                      {list.members?.map((member) => {
                        const profile = memberProfiles[member.userId];
                        const roleLabels: Record<MemberRole, string> = {
                          owner: "Dueño",
                          admin: "Admin",
                          editor: "Editor",
                          viewer: "Espectador",
                        };
                        return (
                          <div
                            key={member.userId}
                            className="flex items-center gap-4 p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]"
                          >
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                              {profile?.name?.[0]?.toUpperCase() ||
                                profile?.email?.[0]?.toUpperCase() ||
                                "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-[var(--text-primary)] truncate">
                                {profile?.name || profile?.email || "Usuario"}
                              </p>
                              <p className="text-sm text-[var(--text-secondary)]">
                                {roleLabels[member.role]}
                              </p>
                            </div>
                            {isOwner && member.userId !== user!.id && (
                              <div className="flex items-center gap-2">
                                <select
                                  value={member.role}
                                  onChange={(e) =>
                                    handleRoleChange(
                                      member.userId,
                                      e.target.value as MemberRole,
                                    )
                                  }
                                  className="px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)]"
                                >
                                  <option value="admin">Admin</option>
                                  <option value="editor">Editor</option>
                                  <option value="viewer">Espectador</option>
                                </select>
                                <button
                                  onClick={() =>
                                    handleRemoveMember(member.userId)
                                  }
                                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {isOwner && (
                      <button
                        onClick={handleDeleteList}
                        className="mt-8 w-full py-3 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-600 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <Trash2 size={18} /> Eliminar Lista
                      </button>
                    )}
                  </div>
                )}

                {/* BACKGROUNDS TAB */}
                {activeTab === "backgrounds" && (
                  <div className="space-y-6">
                    {/* Category Management */}
                    <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
                      <div>
                        <h3 className="text-lg font-bold text-[var(--text-primary)]">
                          Gestionar Categorías
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)]">
                          Crear, editar y reordenar
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setIsManagingCategories(!isManagingCategories)
                        }
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${isManagingCategories ? "bg-blue-500 text-white" : "bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-blue-500/10"}`}
                      >
                        {isManagingCategories ? "Listo" : "Gestionar"}
                      </button>
                    </div>

                    {isManagingCategories && (
                      <div className="space-y-4 p-4 bg-[var(--bg-secondary)]/50 rounded-xl border border-[var(--border-color)]">
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
                                  onSave={() => handleUpdateCategory(cat.id)}
                                  onCancel={() => setEditingCategoryId(null)}
                                  onStartEdit={() => {
                                    setEditingCategoryId(cat.id);
                                    setEditDraft({
                                      name: cat.name,
                                      emoji: cat.emoji || "📁",
                                    });
                                  }}
                                  onDelete={() => handleDeleteCategory(cat.id)}
                                />
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>

                        {showAddCategory ? (
                          <div className="flex items-center gap-2 p-3 bg-[var(--bg-primary)] rounded-xl border-2 border-blue-500/30">
                            <input
                              type="text"
                              value={newCategoryEmoji}
                              onChange={(e) =>
                                setNewCategoryEmoji(e.target.value)
                              }
                              className="w-12 h-12 text-center text-2xl bg-[var(--bg-secondary)] border-2 border-[var(--border-color)] rounded-xl focus:outline-none focus:border-blue-500"
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
                              className="flex-1 px-4 py-3 bg-[var(--bg-secondary)] border-2 border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
                              placeholder="Nueva categoría..."
                              autoFocus
                            />
                            <button
                              onClick={handleAddCategory}
                              className="p-2 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20"
                            >
                              <Check size={20} />
                            </button>
                            <button
                              onClick={() => setShowAddCategory(false)}
                              className="p-2 rounded-lg bg-gray-500/10 text-gray-600 hover:bg-gray-500/20"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowAddCategory(true)}
                            className="w-full py-3 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-blue-500/50 hover:bg-blue-500/5 transition-all"
                          >
                            <Plus size={20} /> Añadir Categoría
                          </button>
                        )}
                      </div>
                    )}

                    {/* Images by Category */}
                    <div className="space-y-6">
                      {categories.map((category) => {
                        const images = groupedImages[category.name] || [];
                        const isExpanded =
                          expandedCategories[category.name] ?? true;
                        return (
                          <div key={category.id} className="space-y-3">
                            <div className="w-full flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] hover:border-blue-500/30 transition-all">
                              <button
                                onClick={() => toggleCategory(category.name)}
                                className="flex-1 flex items-center gap-3 text-left"
                              >
                                <span className="text-2xl">
                                  {category.emoji}
                                </span>
                                <span className="font-semibold text-[var(--text-primary)]">
                                  {category.name}
                                </span>
                                <span className="px-2 py-0.5 text-xs font-bold bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] rounded-full">
                                  {images.length}
                                </span>
                              </button>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openUploadModal(category.name)}
                                  className="p-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors"
                                >
                                  <Plus size={18} />
                                </button>
                                <button
                                  onClick={() => toggleCategory(category.name)}
                                  className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] transition-colors"
                                >
                                  {isExpanded ? (
                                    <ChevronUp size={20} />
                                  ) : (
                                    <ChevronDown size={20} />
                                  )}
                                </button>
                              </div>
                            </div>

                            {isExpanded && (
                              <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragStart={handleImageDragStart}
                                onDragEnd={handleImageDragEnd}
                              >
                                <SortableContext
                                  items={images.map((img) => img.id)}
                                  strategy={horizontalListSortingStrategy}
                                >
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {images.length === 0 ? (
                                      <button
                                        onClick={() =>
                                          openUploadModal(category.name)
                                        }
                                        className="col-span-full py-8 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--border-color)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-blue-500/50 hover:bg-blue-500/5 transition-all"
                                      >
                                        <ImageIcon size={32} />
                                        <span className="text-sm font-medium">
                                          Añadir imágenes a {category.name}
                                        </span>
                                      </button>
                                    ) : (
                                      <>
                                        {images.map((img) => (
                                          <SortableImageItem
                                            key={img.id}
                                            image={img}
                                            isSelected={
                                              backgroundImage === img.url
                                            }
                                            category={category.name}
                                            onSelect={(url) =>
                                              setBackgroundImage(
                                                backgroundImage === img.url
                                                  ? ""
                                                  : url,
                                              )
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
                                          className="aspect-square flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--border-color)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-blue-500/50 hover:bg-blue-500/5 transition-all"
                                        >
                                          <Plus size={24} />
                                          <span className="text-xs font-medium">
                                            Agregar
                                          </span>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </SortableContext>
                                <DragOverlay>
                                  {activeImage && (
                                    <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-blue-500 bg-[var(--bg-secondary)] opacity-90">
                                      <img
                                        src={activeImage.url}
                                        alt={activeImage.displayName || ""}
                                        className="w-full h-full object-contain"
                                      />
                                    </div>
                                  )}
                                </DragOverlay>
                              </DndContext>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
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
              onUploaded={(url) => setBackgroundImage(url)}
            />

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
