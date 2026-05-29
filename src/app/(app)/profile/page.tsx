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
    } catch (error) {
      console.error("Error uploading cropped photo:", error);
      alert("Error al subir la foto recortada");
    } finally {
      setIsUploadingPhoto(false);
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
      const updates = {
        name: editName.trim(),
        photoURL: editPhotoURL.trim() || user.photoURL,
      };
      await updateUserInFirestore(user.id, updates);
      updateUser(updates);
      setShowEditProfile(false);
    } catch (error) {
      console.error("Error updating profile:", error);
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
      {/* Photo Cropper Modal */}
      <PhotoCropperModal
        imageSrc={cropImageSrc || ""}
        isOpen={!!cropImageSrc}
        onClose={() => setCropImageSrc(null)}
        onCropComplete={handleCropComplete}
        onDelete={editPhotoURL ? handleDeletePhoto : undefined}
      />

      {/* Premium Edit Profile Modal */}
      <AnimatePresence>
        {showEditProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center"
          >
            {/* Premium Backdrop with Gradient */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-blue-900/70 to-indigo-900/80 backdrop-blur-xl"
              onClick={() => setShowEditProfile(false)}
            />

            {/* Premium Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "relative z-10 w-full max-w-md mx-4",
                "bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden",
                "border border-white/20",
                "flex flex-col max-h-[90vh]",
              )}
            >
              {/* Premium Header with Gradient */}
              <div className="relative px-6 py-5 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0id2hpdGUiIHN0b3Atb3BhY2l0eT0iMC4xIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSJ0cmFuc3BhcmVudCIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYSkiLz48L3N2Zz4=')] opacity-50" />

                <button
                  onClick={() => setShowEditProfile(false)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>

                <div className="relative flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 ring-4 ring-white/10">
                    {editPhotoURL ? (
                      <img
                        src={editPhotoURL}
                        alt="Avatar preview"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User size={28} className="text-white" />
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Editar perfil
                  </h2>
                  <p className="text-sm text-blue-100 mt-1">
                    Personaliza tu información
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Name Input */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Sparkles size={14} className="text-blue-500" />
                    Nombre completo
                  </label>
                  <Input
                    placeholder="Tu nombre"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveProfile()}
                    autoFocus
                    className="text-base"
                  />
                </div>

                {/* Photo Section */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Camera size={14} className="text-blue-500" />
                    Foto de perfil
                  </label>

                  {/* Current Photo Preview */}
                  {editPhotoURL && (
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                      <div className="relative">
                        <img
                          src={editPhotoURL}
                          alt="Current avatar"
                          className="w-16 h-16 rounded-full object-cover ring-2 ring-white shadow-lg"
                        />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <Check size={12} className="text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Foto actual
                        </p>
                        <p className="text-xs text-gray-500">
                          Esta es tu foto de perfil visible para todos
                        </p>
                      </div>
                      <button
                        onClick={handleDeletePhoto}
                        className="p-2 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Eliminar foto"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}

                  {/* Upload Area */}
                  <div
                    className={cn(
                      "relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer group",
                      dragActive
                        ? "border-blue-500 bg-blue-50 scale-[1.02]"
                        : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/30",
                      isUploadingPhoto && "opacity-60 pointer-events-none",
                    )}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      setDragActive(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setDragActive(false);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={isUploadingPhoto}
                    />

                    {isUploadingPhoto ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full border-3 border-blue-200 border-t-blue-600 animate-spin" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">
                          Procesando imagen...
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Upload size={24} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-700">
                            {editPhotoURL
                              ? "Cambiar foto"
                              : "Subir foto de perfil"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Arrastra, pega o haz clic para seleccionar
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] px-2 py-1 bg-gray-100 rounded-full text-gray-500">
                            JPG
                          </span>
                          <span className="text-[10px] px-2 py-1 bg-gray-100 rounded-full text-gray-500">
                            PNG
                          </span>
                          <span className="text-[10px] px-2 py-1 bg-gray-100 rounded-full text-gray-500">
                            Máx. 5MB
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mobile Camera Hint */}
                  <p className="text-xs text-gray-400 text-center">
                    Compatible con cámara del teléfono, galería y desktop
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-6 pt-4 border-t border-gray-100 bg-gradient-to-b from-white to-gray-50/50">
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setShowEditProfile(false)}
                    className="flex-1 h-11"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    isLoading={isSavingProfile}
                    disabled={!editName.trim()}
                    className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    icon={<Check size={16} />}
                  >
                    Guardar cambios
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
