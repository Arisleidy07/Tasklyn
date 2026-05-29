"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useListStore } from "@/stores/listStore";
import { useTaskStore } from "@/stores/taskStore";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuthStore();
  const { lists } = useListStore();
  const { tasks } = useTaskStore();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhotoURL, setEditPhotoURL] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      bg: "bg-blue-50",
    },
    {
      label: "Listas compartidas",
      value: sharedLists.length,
      icon: Users,
      color: "text-gray-600",
      bg: "bg-gray-100",
    },
    {
      label: "Tareas completadas",
      value: completedTasks.length,
      icon: CheckCircle2,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Tareas pendientes",
      value: pendingTasks.length,
      icon: Clock,
      color: "text-gray-600",
      bg: "bg-gray-100",
    },
  ];

  return (
    <>
      <ProfileHeader />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 md:pt-8 pb-6 md:pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6"
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
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight truncate">
                          {user.name}
                        </h1>
                        <button
                          onClick={handleOpenEdit}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex-shrink-0"
                          title="Editar perfil"
                        >
                          <Edit2 size={14} />
                        </button>
                        <Badge
                          variant={user.plan === "PRO" ? "blue" : "default"}
                        >
                          {user.plan === "PRO" ? "PRO" : "Gratis"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                        <Mail size={12} />
                        <span className="truncate">{user.email}</span>
                      </div>
                      <p className="text-gray-400 flex items-center gap-1.5 text-xs mt-0.5">
                        <Calendar size={11} />
                        Miembro desde {joinDate}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {user.plan === "FREE" && (
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
                    className="p-3 sm:p-4 rounded-xl bg-gray-50 border border-gray-100 transition-colors hover:border-blue-100"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-2`}
                    >
                      <s.icon size={16} className={s.color} />
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {s.value}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-tight">
                      {s.label}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Barra de progreso de tareas */}
            {userTasks.length > 0 && (
              <div className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 border-t border-gray-100 bg-gray-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <TrendingUp size={12} />
                    Progreso general de tareas
                  </span>
                  <span className="text-xs font-bold text-blue-600">
                    {completionRate}%
                  </span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
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
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
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
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <FolderOpen size={14} className="text-blue-600" />
                      </div>
                      <span className="text-sm text-gray-700 font-medium truncate flex-1 group-hover:text-gray-900">
                        {list.name}
                      </span>
                      <span className="text-xs text-gray-400">
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
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6"
            >
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Shield size={16} className="text-blue-600" />
                Cuenta
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Mail size={14} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-700">
                        Correo electrónico
                      </p>
                      <p className="text-xs text-gray-500 truncate max-w-[160px]">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <CheckCircle2
                    size={14}
                    className="text-blue-500 flex-shrink-0"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Crown size={14} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-700">
                        Plan actual
                      </p>
                      <p className="text-xs text-gray-500">
                        {user.plan === "PRO"
                          ? "Acceso ilimitado"
                          : "5 listas · 20 tareas"}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={user.plan === "PRO" ? "blue" : "default"}
                    className="text-[10px]"
                  >
                    {user.plan === "PRO" ? "PRO" : "Gratis"}
                  </Badge>
                </div>

                <Link
                  href="/settings"
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Settings size={14} className="text-gray-500" />
                    </div>
                    <p className="text-xs font-medium text-gray-700">
                      Configuración
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-gray-400" />
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

      {/* Edit Profile Modal - DISEÑO MINIMALISTA EJECUTIVO */}
      <AnimatePresence>
        {showEditProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99990] flex items-center justify-center p-4"
          >
            {/* Simple dark overlay - NO blur exagerado */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowEditProfile(false)}
            />

            {/* Clean modal - estilo Linear/Stripe */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "relative z-10 w-full max-w-[420px]",
                "bg-white rounded-2xl shadow-xl overflow-hidden",
                "flex flex-col max-h-[85vh]",
              )}
            >
              {/* Clean header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">
                  Editar perfil
                </h2>
                <button
                  onClick={() => setShowEditProfile(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Photo - Top centered */}
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                      {editPhotoURL ? (
                        <img
                          src={editPhotoURL}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={32} className="text-gray-400" />
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 w-7 h-7 bg-gray-900 hover:bg-gray-800 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
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
                  <p className="text-xs text-gray-500 mt-2">
                    {editPhotoURL ? "Cambiar foto" : "Agregar foto"}
                  </p>
                </div>

                {/* Name Input */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Nombre
                  </label>
                  <Input
                    placeholder="Tu nombre completo"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveProfile()}
                    autoFocus
                    className="h-11"
                  />
                </div>

                {/* Email (read only) */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Correo electrónico
                  </label>
                  <div className="h-11 px-3 flex items-center bg-gray-50 rounded-lg text-sm text-gray-500 border border-gray-200">
                    {user.email}
                  </div>
                </div>

                {/* Delete photo link */}
                {editPhotoURL && (
                  <button
                    onClick={handleDeletePhoto}
                    className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
                  >
                    Eliminar foto de perfil
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="p-5 pt-4 border-t border-gray-100 bg-gray-50/50">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEditProfile(false)}
                    className="flex-1 h-10 px-4 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={!editName.trim() || isSavingProfile}
                    className={cn(
                      "flex-1 h-10 px-4 rounded-lg text-sm font-medium text-white transition-colors",
                      !editName.trim() || isSavingProfile
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-gray-900 hover:bg-gray-800",
                    )}
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
      </AnimatePresence>
    </>
  );
}
