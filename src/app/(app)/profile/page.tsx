"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useListStore } from "@/stores/listStore";
import { useTaskStore } from "@/stores/taskStore";
import { useUIStore } from "@/stores/uiStore";
import { updateUser as updateUserInFirestore } from "@/lib/firestore";
import {
  uploadProfilePhoto,
  prepareImageFile,
  deleteProfilePhoto,
} from "@/lib/storage";
import { auth } from "@/lib/firebase";
import { updateProfile } from "firebase/auth";
import ProfileHeader from "./header";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import PhotoCropperModal from "@/components/profile/PhotoCropperModal";
import {
  Mail,
  Calendar,
  LogOut,
  Crown,
  Shield,
  CheckCircle2,
  FolderOpen,
  Users,
  Clock,
  TrendingUp,
  Settings,
  ChevronRight,
  Edit2,
  Upload,
  X,
  Check,
  Camera,
  Trash2,
  User,
  Sparkles,
  Sun,
  Moon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuthStore();
  const { lists } = useListStore();
  const { tasks } = useTaskStore();
  const { theme, toggleTheme } = useUIStore();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhotoURL, setEditPhotoURL] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const handleOpenEdit = () => {
    setEditName(user.name);
    setEditPhotoURL(user.photoURL || "");
    setShowEditProfile(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageSelect(file);
  };

  const handleImageSelect = async (file: File) => {
    try {
      await prepareImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setCropImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Error al procesar la imagen",
      );
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsUploadingPhoto(true);
    try {
      const downloadURL = await uploadProfilePhoto(
        user.id,
        croppedBlob,
        `avatar-${Date.now()}.jpg`,
      );
      setEditPhotoURL(downloadURL);
      setCropImageSrc(null);

      // Auto-save to Firestore and Auth immediately after crop
      await handleSavePhoto(downloadURL);
    } catch (error) {
      console.error("Error uploading cropped photo:", error);
      alert("Error al subir la foto");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSavePhoto = async (photoURL: string) => {
    try {
      // Update Firestore
      await updateUserInFirestore(user.id, { photoURL });

      // Update Firebase Auth profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL });
      }

      // Update local state
      updateUser({ photoURL });
    } catch (error) {
      console.error("Error saving photo:", error);
    }
  };

  const handleDeletePhoto = async () => {
    if (user.photoURL) {
      await deleteProfilePhoto(user.photoURL);
    }
    setEditPhotoURL("");
    const updates = { photoURL: "" };
    await updateUserInFirestore(user.id, updates);
    updateUser(updates);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) return;
    setIsSavingProfile(true);
    try {
      const updates: { name: string; photoURL?: string } = {
        name: editName.trim(),
      };

      // Only include photoURL if it changed
      if (editPhotoURL !== user.photoURL) {
        updates.photoURL = editPhotoURL;
      }

      // Update Firestore
      await updateUserInFirestore(user.id, updates);

      // Update Firebase Auth profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: updates.name,
          ...(updates.photoURL && { photoURL: updates.photoURL }),
        });
      }

      // Update local state
      updateUser(updates);
      setShowEditProfile(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error al guardar el perfil");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const joinDate = new Date(user.createdAt).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
  });

  const createdLists = lists.filter((l) => l.owner === user.id);
  const sharedLists = lists.filter(
    (l) => l.owner !== user.id && l.members.some((m) => m.userId === user.id),
  );
  const userTasks = tasks.filter((t) => lists.some((l) => l.id === t.listId));
  const completedTasks = userTasks.filter((t) => t.status === "completed");
  const pendingTasks = userTasks.filter((t) => t.status === "pending");
  const completionRate =
    userTasks.length > 0
      ? Math.round((completedTasks.length / userTasks.length) * 100)
      : 0;

  const stats = [
    {
      label: "Listas creadas",
      value: createdLists.length,
      icon: FolderOpen,
      color: "text-blue-600",
      bgStyle: {
        backgroundColor: "rgba(37,99,235,0.08)",
      } as React.CSSProperties,
    },
    {
      label: "Listas compartidas",
      value: sharedLists.length,
      icon: Users,
      color: "",
      bgStyle: {
        backgroundColor: "var(--bg-secondary)",
      } as React.CSSProperties,
    },
    {
      label: "Tareas completadas",
      value: completedTasks.length,
      icon: CheckCircle2,
      color: "text-blue-600",
      bgStyle: {
        backgroundColor: "rgba(37,99,235,0.08)",
      } as React.CSSProperties,
    },
    {
      label: "Tareas pendientes",
      value: pendingTasks.length,
      icon: Clock,
      color: "",
      bgStyle: {
        backgroundColor: "var(--bg-secondary)",
      } as React.CSSProperties,
    },
  ];

  return (
    <>
      <ProfileHeader />
      <div
        className="min-h-screen"
        style={{ backgroundColor: "var(--bg-secondary)" }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 md:pt-8 pb-6 md:pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border shadow-sm overflow-hidden mb-6"
            style={{
              backgroundColor: "var(--bg-card)",
              borderColor: "var(--border-color)",
            }}
          >
            <div className="px-4 sm:px-6 md:px-8 pt-5 sm:pt-7 pb-4 sm:pb-6">
              <div className="flex items-start gap-4 sm:gap-5 mb-5 sm:mb-6">
                <Avatar
                  name={user.name}
                  photoURL={user.photoURL}
                  size="xl"
                  className="w-16 h-16 sm:w-20 sm:h-20 text-xl ring-4 ring-white shadow-md flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1
                          className="text-xl sm:text-2xl font-bold tracking-tight truncate"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {user.name}
                        </h1>
                        <button
                          onClick={handleOpenEdit}
                          className="p-1.5 rounded-lg transition-colors flex-shrink-0"
                          style={{ color: "var(--text-secondary)" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "#2563eb";
                            e.currentTarget.style.backgroundColor =
                              "var(--bg-info)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color =
                              "var(--text-secondary)";
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                          }}
                          title="Editar perfil"
                        >
                          <Edit2 size={14} />
                        </button>
                        <Badge
                          variant={
                            user.plan === "pro" || user.plan === "business"
                              ? "blue"
                              : "default"
                          }
                        >
                          {user.plan === "business"
                            ? "BUSINESS"
                            : user.plan === "pro"
                              ? "PRO"
                              : "Gratis"}
                        </Badge>
                      </div>
                      <div
                        className="flex items-center gap-1.5 text-sm mt-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <Mail size={12} />
                        <span className="truncate">{user.email}</span>
                      </div>
                      <p
                        className="flex items-center gap-1.5 text-xs mt-0.5"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        <Calendar size={11} />
                        Miembro desde {joinDate}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {user.plan === "free" && (
                        <Button
                          size="sm"
                          variant="outline"
                          icon={<Crown size={14} />}
                          className="whitespace-nowrap"
                        >
                          <span className="hidden sm:inline">
                            Actualizar a PRO
                          </span>
                          <span className="sm:hidden">PRO</span>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleLogout}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        icon={<LogOut size={14} />}
                      >
                        Salir
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <motion.div
                className="grid grid-cols-2 gap-3 sm:gap-4"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
                  },
                }}
              >
                {stats.map((s) => (
                  <motion.div
                    key={s.label}
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{
                      y: -2,
                      boxShadow: "0 4px 16px -4px rgba(59,130,246,0.12)",
                    }}
                    className="p-3 sm:p-4 rounded-xl border transition-colors"
                    style={{
                      backgroundColor: "var(--bg-secondary)",
                      borderColor: "var(--border-color)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor =
                        "var(--border-secondary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border-color)";
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                      style={s.bgStyle}
                    >
                      <s.icon size={16} className={s.color} />
                    </div>
                    <p
                      className="text-xl sm:text-2xl font-bold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {s.value}
                    </p>
                    <p
                      className="text-xs mt-0.5 leading-tight"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {s.label}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Barra de progreso de tareas */}
            {userTasks.length > 0 && (
              <div
                className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 border-t"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-secondary)",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <TrendingUp size={12} />
                    Progreso general de tareas
                  </span>
                  <span className="text-xs font-bold text-blue-600">
                    {completionRate}%
                  </span>
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: "var(--border-color)" }}
                >
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-700"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
            )}
          </motion.div>

          {/* Secciones inferiores */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Mis listas */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl border shadow-sm p-4 sm:p-6"
              style={{
                backgroundColor: "var(--bg-card)",
                borderColor: "var(--border-color)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-sm font-semibold flex items-center gap-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  <FolderOpen size={16} className="text-blue-600" />
                  Mis listas recientes
                </h2>
                <Link
                  href="/dashboard?section=lists"
                  className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
                >
                  Ver todas <ChevronRight size={12} />
                </Link>
              </div>
              {createdLists.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  Sin listas todavía
                </p>
              ) : (
                <div className="space-y-2">
                  {createdLists.slice(0, 4).map((list) => (
                    <Link
                      key={list.id}
                      href={`/lists/${list.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl transition-colors group"
                      style={{
                        color: "var(--text-secondary)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--bg-hover)";
                        e.currentTarget.style.color = "var(--text-primary)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "var(--text-secondary)";
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: "var(--bg-info)" }}
                      >
                        <FolderOpen size={14} style={{ color: "#2563eb" }} />
                      </div>
                      <span className="text-sm font-medium truncate flex-1">
                        {list.name}
                      </span>
                      <span style={{ color: "var(--text-tertiary)" }}>
                        {list.members.length} miembro
                        {list.members.length !== 1 ? "s" : ""}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Cuenta y plan */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border shadow-sm p-4 sm:p-6"
              style={{
                backgroundColor: "var(--bg-card)",
                borderColor: "var(--border-color)",
              }}
            >
              <h2
                className="text-sm font-semibold flex items-center gap-2 mb-4"
                style={{ color: "var(--text-primary)" }}
              >
                <Shield size={16} className="text-blue-600" />
                Cuenta
              </h2>
              <div className="space-y-3">
                <div
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ backgroundColor: "var(--bg-secondary)" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: "rgba(37,99,235,0.08)" }}
                    >
                      <Mail size={14} className="text-blue-600" />
                    </div>
                    <div>
                      <p
                        className="text-xs font-medium"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Correo electrónico
                      </p>
                      <p
                        className="text-xs truncate max-w-[160px]"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <CheckCircle2
                    size={14}
                    className="text-blue-500 flex-shrink-0"
                  />
                </div>

                <div
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ backgroundColor: "var(--bg-secondary)" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: "rgba(37,99,235,0.08)" }}
                    >
                      <Crown size={14} className="text-blue-600" />
                    </div>
                    <div>
                      <p
                        className="text-xs font-medium"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Plan actual
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {user.plan === "business"
                          ? "Plan empresarial completo"
                          : user.plan === "pro"
                            ? "Acceso ilimitado"
                            : "3 listas · 50 tareas"}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      user.plan === "pro" || user.plan === "business"
                        ? "blue"
                        : "default"
                    }
                    className="text-[10px]"
                  >
                    {user.plan === "business"
                      ? "BUSINESS"
                      : user.plan === "pro"
                        ? "PRO"
                        : "Gratis"}
                  </Badge>
                </div>

                {/* Toggle de tema rápido en el perfil */}
                <div
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ backgroundColor: "var(--bg-secondary)" }}
                >
                  <div className="flex flex-col gap-0.5">
                    <p
                      className="text-xs font-medium"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Tema de Tasklyn
                    </p>
                    <p
                      className="text-[11px]"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Alterna entre modo claro y oscuro desde tu perfil.
                    </p>
                  </div>
                  {/* Linear-style Segment Control Theme Selector */}
                  <div
                    className="flex items-center p-1 rounded-lg border"
                    style={{
                      backgroundColor: "var(--bg-secondary)",
                      borderColor: "var(--border-color)",
                    }}
                  >
                    <button
                      onClick={() => theme === "dark" && toggleTheme()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300"
                      style={{
                        backgroundColor:
                          theme === "light" ? "var(--bg-card)" : "transparent",
                        color:
                          theme === "light"
                            ? "#2563eb"
                            : "var(--text-secondary)",
                        boxShadow:
                          theme === "light"
                            ? "0 1px 3px rgba(0,0,0,0.1)"
                            : "none",
                      }}
                    >
                      <Sun size={14} />
                      Claro
                    </button>
                    <button
                      onClick={() => theme === "light" && toggleTheme()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300"
                      style={{
                        backgroundColor:
                          theme === "dark" ? "var(--bg-card)" : "transparent",
                        color:
                          theme === "dark"
                            ? "#2563eb"
                            : "var(--text-secondary)",
                        boxShadow:
                          theme === "dark"
                            ? "0 1px 3px rgba(0,0,0,0.1)"
                            : "none",
                      }}
                    >
                      <Moon size={14} />
                      Oscuro
                    </button>
                  </div>
                </div>

                <Link
                  href="/settings"
                  className="flex items-center justify-between p-3 rounded-xl transition-colors"
                  style={{ backgroundColor: "var(--bg-secondary)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--bg-secondary)";
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: "var(--bg-tertiary)" }}
                    >
                      <Settings
                        size={14}
                        style={{ color: "var(--text-secondary)" }}
                      />
                    </div>
                    <p
                      className="text-xs font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Configuración
                    </p>
                  </div>
                  <ChevronRight
                    size={14}
                    style={{ color: "var(--text-tertiary)" }}
                  />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      {/* Photo Cropper Modal - Z-INDEX 100000 POR ENCIMA DE TODO */}
      <PhotoCropperModal
        imageSrc={cropImageSrc || ""}
        isOpen={!!cropImageSrc}
        onClose={() => setCropImageSrc(null)}
        onCropComplete={handleCropComplete}
        onDelete={editPhotoURL ? handleDeletePhoto : undefined}
        currentPhotoURL={editPhotoURL}
      />

      {/* Edit Profile Modal - DISEÑO PREMIUM MINIMALISTA */}
      {mounted &&
        showEditProfile &&
        !cropImageSrc &&
        createPortal(
          <AnimatePresence>
            {showEditProfile && !cropImageSrc && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[99990] flex items-center justify-center p-4"
              >
                {/* Overlay elegante - sutil */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-gray-950/40 backdrop-blur-sm"
                  onClick={() => setShowEditProfile(false)}
                />

                {/* Modal premium - estilo Linear/Notion */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 8 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="relative z-10 w-full max-w-[400px] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  {/* Header minimalista */}
                  <div
                    className="flex items-center justify-between px-6 py-5 border-b"
                    style={{ borderColor: "var(--border-color)" }}
                  >
                    <h2
                      className="text-base font-semibold tracking-tight"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Editar perfil
                    </h2>
                    <button
                      onClick={() => setShowEditProfile(false)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: "var(--text-tertiary)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--bg-secondary)";
                        e.currentTarget.style.color = "var(--text-primary)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "var(--text-tertiary)";
                      }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Content - espaciado premium */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Photo Section - elegante */}
                    <div className="flex flex-col items-center">
                      <div className="relative group">
                        <div
                          className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden ring-4 transition-all"
                          style={{ backgroundColor: "var(--bg-secondary)" }}
                        >
                          {editPhotoURL ? (
                            <img
                              src={editPhotoURL}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User
                              size={36}
                              style={{ color: "var(--border-color)" }}
                            />
                          )}
                        </div>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute -bottom-1 -right-1 w-8 h-8 text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"
                          style={{ backgroundColor: "#2563eb" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#1d4ed8";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#2563eb";
                          }}
                        >
                          <Camera size={14} />
                        </button>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <p
                        className="text-xs mt-3 font-medium"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {editPhotoURL
                          ? "Cambiar foto de perfil"
                          : "Agregar foto de perfil"}
                      </p>

                      {/* Eliminar foto */}
                      {editPhotoURL && (
                        <button
                          onClick={handleDeletePhoto}
                          className="mt-2 text-xs text-red-500 hover:text-red-600 font-medium transition-colors flex items-center gap-1"
                        >
                          <Trash2 size={12} />
                          Eliminar foto
                        </button>
                      )}
                    </div>

                    {/* Divider */}
                    <div
                      className="h-px"
                      style={{ backgroundColor: "var(--border-color)" }}
                    />

                    {/* Name Input - limpio */}
                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Nombre completo
                      </label>
                      <Input
                        placeholder="Tu nombre"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleSaveProfile()
                        }
                        autoFocus
                        className="h-11 transition-colors"
                        style={{
                          backgroundColor: "var(--bg-input)",
                          borderColor: "var(--border-input)",
                        }}
                      />
                    </div>

                    {/* Email (read only) - sutil */}
                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        Correo electrónico
                      </label>
                      <div
                        className="h-11 px-3 flex items-center rounded-lg text-sm border border-transparent"
                        style={{
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-tertiary)",
                        }}
                      >
                        {user.email}
                      </div>
                      <p
                        className="text-[11px]"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        El correo no se puede cambiar
                      </p>
                    </div>
                  </div>

                  {/* Actions - modernas */}
                  <div
                    className="p-6 pt-4 border-t"
                    style={{
                      borderColor: "var(--border-color)",
                      backgroundColor: "var(--bg-secondary)",
                    }}
                  >
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowEditProfile(false)}
                        className="flex-1 h-11 px-4 rounded-xl text-sm font-medium transition-colors"
                        style={{ color: "var(--text-secondary)" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "var(--bg-tertiary)";
                          e.currentTarget.style.color = "var(--text-primary)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "var(--text-secondary)";
                        }}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={!editName.trim() || isSavingProfile}
                        className={cn(
                          "flex-1 h-11 px-4 rounded-xl text-sm font-medium text-white transition-all",
                          !editName.trim() || isSavingProfile
                            ? "cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-500 hover:shadow-lg active:scale-[0.98]",
                        )}
                        style={
                          !editName.trim() || isSavingProfile
                            ? {
                                backgroundColor: "var(--bg-tertiary)",
                                color: "var(--text-tertiary)",
                              }
                            : {}
                        }
                      >
                        {isSavingProfile ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Guardando...
                          </span>
                        ) : (
                          "Guardar cambios"
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
