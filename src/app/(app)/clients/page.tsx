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
          className="rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-color)",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Users size={18} style={{ color: "var(--text-on-accent)" }} />
              </div>
              <h3
                className="text-lg font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="transition-colors"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-tertiary)";
              }}
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Nombre *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del cliente"
                required
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  border: "1px solid var(--border-input)",
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Correo
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    border: "1px solid var(--border-input)",
                    backgroundColor: "var(--bg-input)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 000 000 0000"
                  className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    border: "1px solid var(--border-input)",
                    backgroundColor: "var(--bg-input)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Dirección
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Dirección o ciudad"
                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  border: "1px solid var(--border-input)",
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Notas
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas internas..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                style={{
                  border: "1px solid var(--border-input)",
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Etiquetas
              </label>
              <div className="flex gap-2 mb-2 flex-wrap">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: "rgba(37,99,235,0.08)",
                      color: "#2563eb",
                    }}
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
                  className="flex-1 px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    border: "1px solid var(--border-input)",
                    backgroundColor: "var(--bg-input)",
                    color: "var(--text-primary)",
                  }}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--bg-tertiary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--bg-secondary)";
                  }}
                >
                  Añadir
                </button>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{
                  border: "1px solid var(--border-color)",
                  color: "var(--text-secondary)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                style={{ color: "var(--text-on-accent)" }}
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
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-sm font-medium rounded-xl transition-colors"
            style={{ color: "var(--text-on-accent)" }}
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
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-tertiary)" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, correo, teléfono o etiqueta..."
            className="w-full pl-9 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{
              border: "1px solid var(--border-input)",
              backgroundColor: "var(--bg-input)",
              color: "var(--text-primary)",
            }}
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
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "var(--bg-secondary)" }}
            >
              <Users size={32} style={{ color: "var(--text-tertiary)" }} />
            </div>
            <h3
              className="text-xl font-semibold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              {search ? "Sin resultados" : "Sin clientes aún"}
            </h3>
            <p className="mb-4" style={{ color: "var(--text-secondary)" }}>
              {search
                ? "Intenta con otro término de búsqueda."
                : "Agrega tu primer cliente para comenzar."}
            </p>
            {!search && (
              <button
                onClick={() => setShowCreate(true)}
                className="px-4 py-2 bg-blue-600 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                style={{ color: "var(--text-on-accent)" }}
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
                className="rounded-2xl overflow-hidden"
                style={{
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-card)",
                }}
              >
                {/* Header row */}
                <div className="flex items-center gap-4 p-4">
                  <Avatar name={client.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-semibold truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {client.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {client.email && (
                        <a
                          href={`mailto:${client.email}`}
                          className="flex items-center gap-1 text-xs hover:text-blue-600 transition-colors"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          <Mail size={11} />
                          {client.email}
                        </a>
                      )}
                      {client.phone && (
                        <a
                          href={`tel:${client.phone}`}
                          className="flex items-center gap-1 text-xs hover:text-green-600 transition-colors"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          <Phone size={11} />
                          {client.phone}
                        </a>
                      )}
                      {client.address && (
                        <span
                          className="flex items-center gap-1 text-xs"
                          style={{ color: "var(--text-tertiary)" }}
                        >
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
                            className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                            style={{
                              backgroundColor: "rgba(37,99,235,0.08)",
                              color: "#2563eb",
                            }}
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
                      className="p-2 transition-colors"
                      style={{ color: "var(--text-tertiary)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "var(--text-primary)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--text-tertiary)";
                      }}
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
                      className="p-2 transition-colors"
                      style={{ color: "var(--text-tertiary)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#2563eb";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--text-tertiary)";
                      }}
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(client.id)}
                      className="p-2 transition-colors"
                      style={{ color: "var(--text-tertiary)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#ef4444";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--text-tertiary)";
                      }}
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
                      className="px-4 py-3"
                      style={{ borderTop: "1px solid var(--border-color)" }}
                    >
                      <div className="flex items-start gap-2">
                        <FileText
                          size={14}
                          className="mt-0.5 flex-shrink-0"
                          style={{ color: "var(--text-tertiary)" }}
                        />
                        <p
                          className="text-sm whitespace-pre-wrap"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {client.notes}
                        </p>
                      </div>
                      <p
                        className="text-[10px] mt-2"
                        style={{ color: "var(--text-tertiary)" }}
                      >
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
