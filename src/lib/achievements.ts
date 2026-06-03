// ============================================
// TASKLYN — Achievements & Recognition Service
// ============================================

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
  onSnapshot,
  increment,
} from "firebase/firestore";
import { db } from "./firebase";

// Achievement types
export type AchievementType =
  | "tasks_completed"
  | "tasks_created"
  | "streak_days"
  | "early_bird"
  | "night_owl"
  | "team_player"
  | "list_master"
  | "productivity_peak"
  | "week_warrior"
  | "month_master"
  | "top_performer"
  | "milestone_100"
  | "milestone_500"
  | "milestone_1000";

export interface Achievement {
  id: string;
  userId: string;
  type: AchievementType;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
  metadata?: Record<string, unknown>;
}

export interface UserStats {
  userId: string;
  totalTasksCompleted: number;
  totalTasksCreated: number;
  currentStreak: number;
  longestStreak: number;
  weeklyCompleted: number;
  monthlyCompleted: number;
  lastActiveDate: string;
  updatedAt: string;
}

export interface RankingEntry {
  userId: string;
  userName: string;
  userPhoto?: string;
  score: number;
  tasksCompleted: number;
  period: "weekly" | "monthly" | "all_time";
  updatedAt: string;
}

const achievementsCollection = collection(db, "achievements");
const userStatsCollection = collection(db, "userStats");
const rankingsCollection = collection(db, "rankings");

const toDate = (timestamp: unknown): string => {
  if (!timestamp) return new Date().toISOString();
  if (typeof timestamp === "string") return timestamp;
  if (timestamp instanceof Date) return timestamp.toISOString();
  if (typeof (timestamp as Timestamp).toDate === "function")
    return (timestamp as Timestamp).toDate().toISOString();
  const raw = timestamp as { seconds?: number; nanoseconds?: number };
  if (typeof raw.seconds === "number")
    return new Date(raw.seconds * 1000).toISOString();
  return new Date().toISOString();
};

// Achievement definitions
const ACHIEVEMENT_DEFINITIONS: Record<
  AchievementType,
  { title: string; description: string; icon: string; threshold: number }
> = {
  tasks_completed: {
    title: "Productivo",
    description: "Completa 10 tareas en un día",
    icon: "🎯",
    threshold: 10,
  },
  tasks_created: {
    title: "Organizado",
    description: "Crea 50 tareas",
    icon: "📝",
    threshold: 50,
  },
  streak_days: {
    title: "Consistente",
    description: "Activo 7 días seguidos",
    icon: "🔥",
    threshold: 7,
  },
  early_bird: {
    title: "Madrugador",
    description: "Completa 5 tareas antes de las 9am",
    icon: "🌅",
    threshold: 5,
  },
  night_owl: {
    title: "Nocturno",
    description: "Completa 5 tareas después de las 9pm",
    icon: "🌙",
    threshold: 5,
  },
  team_player: {
    title: "Jugador de equipo",
    description: "Colabora en 10 tareas de equipo",
    icon: "🤝",
    threshold: 10,
  },
  list_master: {
    title: "Maestro de listas",
    description: "Crea 10 listas",
    icon: "📋",
    threshold: 10,
  },
  productivity_peak: {
    title: "Pico de productividad",
    description: "Completa 20 tareas en una semana",
    icon: "📈",
    threshold: 20,
  },
  week_warrior: {
    title: "Guerrero de la semana",
    description: "Top #1 de la semana",
    icon: "🏆",
    threshold: 1,
  },
  month_master: {
    title: "Maestro del mes",
    description: "Top #1 del mes",
    icon: "👑",
    threshold: 1,
  },
  top_performer: {
    title: "Mejor desempeño",
    description: "3 veces en el top 3",
    icon: "⭐",
    threshold: 3,
  },
  milestone_100: {
    title: "Centenario",
    description: "100 tareas completadas",
    icon: "💯",
    threshold: 100,
  },
  milestone_500: {
    title: "Super Productivo",
    description: "500 tareas completadas",
    icon: "🚀",
    threshold: 500,
  },
  milestone_1000: {
    title: "Leyenda",
    description: "1000 tareas completadas",
    icon: "🏅",
    threshold: 1000,
  },
};

// Get or create user stats
export const getUserStats = async (userId: string): Promise<UserStats> => {
  const statsRef = doc(userStatsCollection, userId);
  const snap = await getDoc(statsRef);

  if (!snap.exists()) {
    const defaultStats: UserStats = {
      userId,
      totalTasksCompleted: 0,
      totalTasksCreated: 0,
      currentStreak: 0,
      longestStreak: 0,
      weeklyCompleted: 0,
      monthlyCompleted: 0,
      lastActiveDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(statsRef, defaultStats);
    return defaultStats;
  }

  const data = snap.data();
  return {
    ...data,
    userId,
    lastActiveDate: toDate(data.lastActiveDate),
    updatedAt: toDate(data.updatedAt),
  } as UserStats;
};

// Update user stats when task is completed
export const recordTaskCompletion = async (
  userId: string,
  taskData?: { completedAt?: string; isTeamTask?: boolean },
): Promise<Achievement[]> => {
  const stats = await getUserStats(userId);
  const newAchievements: Achievement[] = [];
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const lastActive = stats.lastActiveDate.split("T")[0];

  // Calculate streak
  let newStreak = stats.currentStreak;
  if (lastActive === today) {
    // Already active today
  } else if (lastActive === getYesterday(today)) {
    newStreak += 1;
  } else {
    newStreak = 1;
  }

  // Update stats
  const updates: Partial<UserStats> = {
    totalTasksCompleted: increment(1) as unknown as number,
    lastActiveDate: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  if (newStreak !== stats.currentStreak) {
    updates.currentStreak = newStreak;
    if (newStreak > stats.longestStreak) {
      updates.longestStreak = newStreak;
    }
  }

  // Weekly and monthly tracking
  const weekKey = getWeekKey(now);
  const monthKey = getMonthKey(now);

  // Get current week/month stats
  const weekStats = await getWeeklyStats(userId, weekKey);
  const monthStats = await getMonthlyStats(userId, monthKey);

  // Check achievements
  const newTotal = stats.totalTasksCompleted + 1;

  // Milestone achievements
  if (newTotal >= 100 && !(await hasAchievement(userId, "milestone_100"))) {
    newAchievements.push(await grantAchievement(userId, "milestone_100"));
  }
  if (newTotal >= 500 && !(await hasAchievement(userId, "milestone_500"))) {
    newAchievements.push(await grantAchievement(userId, "milestone_500"));
  }
  if (newTotal >= 1000 && !(await hasAchievement(userId, "milestone_1000"))) {
    newAchievements.push(await grantAchievement(userId, "milestone_1000"));
  }

  // Streak achievement
  if (newStreak >= 7 && !(await hasAchievement(userId, "streak_days"))) {
    newAchievements.push(await grantAchievement(userId, "streak_days"));
  }

  // Weekly achievement
  if (
    weekStats.count >= 20 &&
    !(await hasAchievement(userId, "productivity_peak"))
  ) {
    newAchievements.push(await grantAchievement(userId, "productivity_peak"));
  }

  // Apply updates
  const statsRef = doc(userStatsCollection, userId);
  await updateDoc(statsRef, updates);

  // Update rankings
  await updateRanking(userId, newTotal);

  return newAchievements;
};

// Check if user has an achievement
export const hasAchievement = async (
  userId: string,
  type: AchievementType,
): Promise<boolean> => {
  const q = query(
    achievementsCollection,
    where("userId", "==", userId),
    where("type", "==", type),
  );
  const snap = await getDocs(q);
  return !snap.empty;
};

// Grant achievement to user
export const grantAchievement = async (
  userId: string,
  type: AchievementType,
): Promise<Achievement> => {
  const definition = ACHIEVEMENT_DEFINITIONS[type];
  const achievementRef = doc(achievementsCollection);

  const achievement: Omit<Achievement, "id"> = {
    userId,
    type,
    title: definition.title,
    description: definition.description,
    icon: definition.icon,
    earnedAt: new Date().toISOString(),
  };

  await setDoc(achievementRef, achievement);

  return {
    ...achievement,
    id: achievementRef.id,
  };
};

// Get user achievements
export const getUserAchievements = async (
  userId: string,
): Promise<Achievement[]> => {
  const q = query(
    achievementsCollection,
    where("userId", "==", userId),
    orderBy("earnedAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
    earnedAt: toDate(doc.data().earnedAt),
  })) as Achievement[];
};

// Subscribe to user achievements
export const subscribeToUserAchievements = (
  userId: string,
  callback: (achievements: Achievement[]) => void,
): Unsubscribe => {
  const q = query(
    achievementsCollection,
    where("userId", "==", userId),
    orderBy("earnedAt", "desc"),
  );

  return onSnapshot(q, (snap) => {
    const achievements = snap.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
      earnedAt: toDate(doc.data().earnedAt),
    })) as Achievement[];
    callback(achievements);
  });
};

// Update ranking
export const updateRanking = async (
  userId: string,
  score: number,
  period: "weekly" | "monthly" | "all_time" = "all_time",
): Promise<void> => {
  const rankingRef = doc(rankingsCollection, `${userId}_${period}`);

  await setDoc(
    rankingRef,
    {
      userId,
      score,
      period,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
};

// Get top performers
export const getTopPerformers = async (
  period: "weekly" | "monthly" | "all_time" = "weekly",
  count: number = 10,
): Promise<RankingEntry[]> => {
  const q = query(
    rankingsCollection,
    where("period", "==", period),
    orderBy("score", "desc"),
    limit(count),
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      userId: data.userId || "",
      userName: data.userName || "",
      userPhoto: data.userPhoto,
      score: data.score || 0,
      tasksCompleted: data.tasksCompleted || 0,
      period: data.period || period,
      updatedAt: toDate(data.updatedAt),
    } as RankingEntry;
  });
};

// Get weekly stats
const getWeeklyStats = async (userId: string, weekKey: string) => {
  const ref = doc(db, "weeklyStats", `${userId}_${weekKey}`);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return { count: 0, weekKey };
  }

  return { count: snap.data().count || 0, weekKey };
};

// Get monthly stats
const getMonthlyStats = async (userId: string, monthKey: string) => {
  const ref = doc(db, "monthlyStats", `${userId}_${monthKey}`);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return { count: 0, monthKey };
  }

  return { count: snap.data().count || 0, monthKey };
};

// Helper functions
const getYesterday = (today: string): string => {
  const date = new Date(today);
  date.setDate(date.getDate() - 1);
  return date.toISOString().split("T")[0];
};

const getWeekKey = (date: Date): string => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split("T")[0];
};

const getMonthKey = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

// Get user position in ranking
export const getUserRanking = async (
  userId: string,
  period: "weekly" | "monthly" | "all_time" = "weekly",
): Promise<{ position: number; total: number }> => {
  const allRankings = await getTopPerformers(period, 1000);
  const position = allRankings.findIndex((r) => r.userId === userId);

  return {
    position: position === -1 ? 0 : position + 1,
    total: allRankings.length,
  };
};

// Calculate employee of the week/month
export const calculateTopPerformers = async (
  teamId: string,
  period: "weekly" | "monthly",
): Promise<
  { userId: string; score: number; achievements: Achievement[] }[]
> => {
  // Get team members
  const teamRef = doc(db, "teams", teamId);
  const teamSnap = await getDoc(teamRef);

  if (!teamSnap.exists()) return [];

  const members = teamSnap.data().members || [];
  const memberIds = members.map((m: { userId: string }) => m.userId);

  // Get stats for each member
  const results = await Promise.all(
    memberIds.map(async (userId: string) => {
      const stats = await getUserStats(userId);
      const achievements = await getUserAchievements(userId);

      const score =
        period === "weekly" ? stats.weeklyCompleted : stats.monthlyCompleted;

      return { userId, score, achievements };
    }),
  );

  // Sort by score
  return results.sort((a, b) => b.score - a.score);
};
