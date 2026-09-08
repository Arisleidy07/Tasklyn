// TEMPORARY visual-QA harness. Only active when NEXT_PUBLIC_UI_PREVIEW=1.
import { useAuthStore } from "@/stores/authStore";
import { useListStore } from "@/stores/listStore";
import { useTaskStore } from "@/stores/taskStore";
import { useTeamStore } from "@/stores/teamStore";
import type { Task, TaskList, User } from "@/types";

export const isDevPreview = () => process.env.NEXT_PUBLIC_UI_PREVIEW === "1";

const now = new Date();
const iso = (d: number) => new Date(now.getTime() + d * 86400000).toISOString();

const user: User = {
  id: "u1",
  name: "Arisleidy Pérez",
  email: "arisleidy@tasklyn.com",
  photoURL: "",
  plan: "free",
  createdAt: iso(-90),
};

const members = [
  { userId: "u1", role: "owner" as const, joinedAt: iso(-90) },
  { userId: "u2", role: "editor" as const, joinedAt: iso(-30) },
];

const lists: TaskList[] = [
  {
    id: "l1",
    name: "Operaciones Junio — Proyecto de expansión regional",
    owner: "u1",
    type: "shared",
    members,
    memberIds: ["u1", "u2"],
    customNames: {},
    createdAt: iso(-40),
    description: "Tareas del área de operaciones",
    color: "#2563eb",
    icon: "💼",
    order: 1,
  },
  {
    id: "l2",
    name: "Compras",
    owner: "u1",
    type: "shared",
    members: [members[0]],
    memberIds: ["u1"],
    customNames: {},
    createdAt: iso(-10),
    color: "#16a34a",
    icon: "🛒",
    order: 2,
  },
];

const mk = (p: Partial<Task> & { id: string; title: string }): Task => ({
  listId: "l1",
  description: "",
  status: "pending",
  assignedTo: null,
  createdBy: "u1",
  completedBy: null,
  createdAt: iso(-3),
  completedAt: null,
  history: [],
  ...p,
});

const tasks: Task[] = [
  mk({
    id: "t1",
    title:
      "Coordinar la instalación del router principal en la sucursal norte con el proveedor externo",
    description:
      "Confirmar horario con el técnico. Llevar credenciales de acceso y verificar que la línea dedicada esté activa antes de la visita.",
    priority: "urgent",
    dueDate: iso(1).slice(0, 10),
    dueTime: "10:30",
    phoneNumbers: ["+1 809 555 0123", "+1 829 555 9876"],
    location: "Av. Winston Churchill 1099, Santo Domingo",
    tags: ["infraestructura", "sucursal-norte"],
    assignedTo: "u2",
    reminders: [{ id: "r1", at: iso(1), sent: false, recipientType: "me" }],
  }),
  mk({ id: "t2", title: "Enviar reporte semanal", priority: "medium", dueDate: iso(2).slice(0, 10) }),
  mk({ id: "t3", title: "Revisar presupuesto Q3", priority: "high" }),
  mk({ id: "t4", title: "Actualizar inventario", priority: "low", status: "completed", completedBy: "u1", completedAt: iso(-1) }),
  mk({ id: "t5", title: "Llamar al proveedor de licencias", status: "completed", completedBy: "u2", completedAt: iso(-2) }),
  mk({ id: "t6", title: "Comprar café", listId: "l2", priority: "low" }),
];

export function seedDevPreview() {
  useTaskStore.getState().unsubscribeAll();
  useListStore.getState().unsubscribeFromLists();
  const apply = () => {
    useListStore.setState({ lists });
    useTaskStore.setState({ tasks });
  };
  [300, 1000, 2500].forEach((ms) => setTimeout(apply, ms));
  useAuthStore.setState({
    user,
    isAuthenticated: true,
    isAuthReady: true,
    isLoading: false,
  });
  useListStore.setState({
    lists,
    isLoading: false,
    subscribeToLists: () => {},
    unsubscribeFromLists: () => {},
    refreshLists: async () => {},
  });
  useTaskStore.setState({
    tasks,
    subscribeToList: () => {},
    unsubscribeFromList: () => {},
    unsubscribeAll: () => {},
  });
  useTeamStore.setState({
    teams: [],
    subscribeToTeams: () => {},
    unsubscribeFromTeams: () => {},
  } as never);
}
