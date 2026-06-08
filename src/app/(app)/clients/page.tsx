"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import {
  subscribeToUserClients,
  createClient,
  updateClient,
  deleteClient,
} from "@/lib/firestore";
import type { Client } from "@/types";
import Header from "@/components/layout/Header";
import Avatar from "@/components/ui/Avatar";
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  FileText,
  Edit3,
  Trash2,
  X,
  Tag,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

// ---- Client Form Modal ----
interface ClientFormProps {
  initial?: Partial<Client>;
  onClose: () => void;
  onSave: (
    data: Omit<Client, "id" | "createdAt" | "updatedAt">,
  ) => Promise<void>;
  title: string;
}

function ClientForm({ initial, onClose, onSave, title }: ClientFormProps) {
  const [name, setName] = useState(initial?.name || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [address, setAddress] = useState(initial?.address || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initial?.tags || []);
  const [saving, setSaving] = useState(false);
  const { user } = useAuthStore();

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, "");
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
        tags: tags.length ? tags : undefined,
        ownerId: user.id,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (typeof document === "undefined") return null;
  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99998] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full border border-gray-200/80 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Users size={18} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                {title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                Nombre *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del cliente"
                required
                autoFocus
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Correo
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 000 000 0000"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                Dirección
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Dirección o ciudad"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                Notas
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas internas..."
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                Etiquetas
              </label>
              <div className="flex gap-2 mb-2 flex-wrap">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 text-xs font-medium"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter((x) => x !== t))}
                      className="ml-0.5 hover:text-red-500"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addTag())
                  }
                  placeholder="#Ventas #Urgente..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-sm font-medium transition-colors"
                >
                  Añadir
                </button>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </>,
    document.body,
  );
}

// ---- Main Page ----
export default function ClientsPage() {
  const { user } = useAuthStore();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToUserClients(user.id, (c) => {
      setClients(c);
      setLoading(false);
    });
    return unsub;
  }, [user?.id]);

  if (!user) return null;

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase())),
  );

  const handleCreate = async (
    data: Omit<Client, "id" | "createdAt" | "updatedAt">,
  ) => {
    await createClient(data);
  };

  const handleUpdate = async (
    data: Omit<Client, "id" | "createdAt" | "updatedAt">,
  ) => {
    if (!editing) return;
    await updateClient(editing.id, data);
    setEditing(null);
  };

  const handleDelete = async (clientId: string) => {
    if (!confirm("¿Eliminar este cliente?")) return;
    await deleteClient(clientId);
  };

  return (
    <>
      <Header
        title="Centro de Clientes"
        description={`${clients.length} cliente${clients.length !== 1 ? "s" : ""} registrado${clients.length !== 1 ? "s" : ""}`}
        showMenuButton={true}
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus size={16} /> Nuevo cliente
          </button>
        }
      />

      <div className="p-3 sm:p-4 md:p-8 max-w-[1000px] mx-auto space-y-5">
        {/* Search */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, correo, teléfono o etiqueta..."
            className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Client list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Users size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
              {search ? "Sin resultados" : "Sin clientes aún"}
            </h3>
            <p className="text-gray-500 dark:text-slate-400 mb-4">
              {search
                ? "Intenta con otro término de búsqueda."
                : "Agrega tu primer cliente para comenzar."}
            </p>
            {!search && (
              <button
                onClick={() => setShowCreate(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Agregar cliente
              </button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filtered.map((client, i) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl border border-gray-200/80 bg-white dark:bg-slate-900 dark:border-slate-800 overflow-hidden"
              >
                {/* Header row */}
                <div className="flex items-center gap-4 p-4">
                  <Avatar name={client.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-slate-100 truncate">
                      {client.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {client.email && (
                        <a
                          href={`mailto:${client.email}`}
                          className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          <Mail size={11} />
                          {client.email}
                        </a>
                      )}
                      {client.phone && (
                        <a
                          href={`tel:${client.phone}`}
                          className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400 hover:text-green-600 transition-colors"
                        >
                          <Phone size={11} />
                          {client.phone}
                        </a>
                      )}
                      {client.address && (
                        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                          <MapPin size={11} />
                          {client.address}
                        </span>
                      )}
                    </div>
                    {client.tags && client.tags.length > 0 && (
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        {client.tags.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 text-[10px] font-medium"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() =>
                        setExpanded(expanded === client.id ? null : client.id)
                      }
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                    >
                      <ChevronDown
                        size={16}
                        className={cn(
                          "transition-transform",
                          expanded === client.id && "rotate-180",
                        )}
                      />
                    </button>
                    <button
                      onClick={() => setEditing(client)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(client.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {/* Expanded notes */}
                <AnimatePresence>
                  {expanded === client.id && client.notes && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-100 dark:border-slate-800 px-4 py-3"
                    >
                      <div className="flex items-start gap-2">
                        <FileText
                          size={14}
                          className="text-gray-400 mt-0.5 flex-shrink-0"
                        />
                        <p className="text-sm text-gray-600 dark:text-slate-400 whitespace-pre-wrap">
                          {client.notes}
                        </p>
                      </div>
                      <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-2">
                        Creado{" "}
                        {format(parseISO(client.createdAt), "d MMM yyyy", {
                          locale: es,
                        })}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <ClientForm
            title="Nuevo Cliente"
            onClose={() => setShowCreate(false)}
            onSave={handleCreate}
          />
        )}
        {editing && (
          <ClientForm
            title="Editar Cliente"
            initial={editing}
            onClose={() => setEditing(null)}
            onSave={handleUpdate}
          />
        )}
      </AnimatePresence>
    </>
  );
}
