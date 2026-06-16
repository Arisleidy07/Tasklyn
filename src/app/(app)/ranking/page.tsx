"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { useTeamStore } from "@/stores/teamStore";
import { useTaskStore } from "@/stores/taskStore";
import { getUser } from "@/lib/firestore";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  Crown,
  Target,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { subDays, startOfDay, parseISO, isAfter } from "date-fns";

interface RankingUser {
  userId: string;
  name: string;
  email: string;
  photoURL?: string;
  completedTasks: number;
  totalTasks: number;
  completionRate: number;
  trend: number; // percentage change
  rank: number;
  previousRank: number;
}

// Extended member type that can have name/email from user object
interface ExtendedTeamMember {
  userId: string;
  role?: string;
  joinedAt?: string;
  name?: string;
  email?: string;
}

interface RankingCardProps {
  user: RankingUser;
  isCurrentUser: boolean;
  showMedal?: boolean;
}

function RankingCard({
  user,
  isCurrentUser,
  showMedal = true,
}: RankingCardProps) {
  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown size={20} className="text-yellow-500" />;
      case 2:
        return <Medal size={20} style={{ color: "var(--text-tertiary)" }} />;
      case 3:
        return <Award size={20} className="text-amber-600" />;
      default:
        return (
          <span
            className="text-lg font-bold"
            style={{ color: "var(--text-tertiary)" }}
          >
            #{rank}
          </span>
        );
    }
  };

  const getMedalBg = (rank: number) => {
    switch (rank) {
      case 1:
        return "";
      case 2:
        return "";
      case 3:
        return "";
      default:
        return "";
    }
  };

  const rankChange = user.previousRank - user.rank;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{
        x: 4,
        boxShadow: "0 10px 30px -10px rgba(59,130,246,0.2)",
      }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="relative p-4 rounded-xl border transition-all duration-300"
      style={
        user.rank === 1
          ? {
              backgroundColor: "rgba(253,224,71,0.1)",
              borderColor: "rgba(234,179,8,0.3)",
            }
          : user.rank === 2
            ? {
                backgroundColor: "rgba(156,163,175,0.08)",
                borderColor: "rgba(156,163,175,0.3)",
              }
            : user.rank === 3
              ? {
                  backgroundColor: "rgba(251,191,36,0.08)",
                  borderColor: "rgba(217,119,6,0.3)",
                }
              : {
                  backgroundColor: "var(--bg-card)",
                  borderColor: "var(--border-color)",
                }
      }
    >
      <div className="flex items-center gap-4">
        {/* Rank */}
        <div className="flex items-center justify-center w-12 h-12">
          {showMedal ? (
            getMedalIcon(user.rank)
          ) : (
            <span
              className="text-lg font-bold"
              style={{ color: "var(--text-secondary)" }}
            >
              #{user.rank}
            </span>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className="font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {user.name}
            </h3>
            {rankChange !== 0 && (
              <div
                className={cn(
                  "flex items-center gap-0.5 text-xs font-medium",
                  rankChange > 0 ? "text-green-600" : "text-red-600",
                )}
              >
                {rankChange > 0 ? (
                  <ChevronUp size={12} />
                ) : (
                  <ChevronDown size={12} />
                )}
                {Math.abs(rankChange)}
              </div>
            )}
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {user.completedTasks} tareas completadas
          </p>
        </div>

        {/* Stats */}
        <div className="text-right">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-2xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {user.completionRate}%
            </span>
            {user.trend !== 0 && (
              <div
                className={cn(
                  "flex items-center gap-0.5 text-xs font-medium",
                  user.trend > 0 ? "text-green-600" : "text-red-600",
                )}
              >
                {user.trend > 0 ? (
                  <TrendingUp size={10} />
                ) : (
                  <ChevronDown size={10} />
                )}
                {Math.abs(user.trend)}%
              </div>
            )}
          </div>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Tasa de cumplimiento
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3">
        <div
          className="w-full rounded-full h-1.5"
          style={{ backgroundColor: "var(--bg-tertiary)" }}
        >
          <div
            className={cn(
              "h-1.5 rounded-full transition-all duration-500",
              user.rank === 1
                ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                : user.rank === 2
                  ? "bg-gradient-to-r from-gray-400 to-slate-500"
                  : user.rank === 3
                    ? "bg-gradient-to-r from-amber-400 to-yellow-500"
                    : "bg-gradient-to-r from-blue-400 to-indigo-500",
            )}
            style={{ width: `${user.completionRate}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export default function RankingPage() {
  const { user } = useAuthStore();
  const { teams, currentTeam } = useTeamStore();
  const { tasks } = useTaskStore();
  const [selectedPeriod, setSelectedPeriod] = useState<
    "today" | "week" | "month" | "year"
  >("month");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [rankingData, setRankingData] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateRankingData = async () => {
      if (!user) return;
      setLoading(true);

      const teamMembers =
        selectedTeam !== "all"
          ? teams.find((t) => t.id === selectedTeam)?.members || []
          : currentTeam
            ? currentTeam.members
            : teams.flatMap((team) => team.members);

      const uniqueMemberIds = Array.from(
        new Set(teamMembers.map((m) => m.userId)),
      );

      // Fetch real profiles
      const profiles = await Promise.all(
        uniqueMemberIds.map(async (uid) => {
          if (uid === user.id)
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              photoURL: user.photoURL,
            };
          const p = await getUser(uid);
          return p
            ? { id: p.id, name: p.name, email: p.email, photoURL: p.photoURL }
            : {
                id: uid,
                name: "...",
                email: "",
                photoURL: undefined,
              };
        }),
      );

      // Compute period boundary
      const periodBoundary = (() => {
        const now = new Date();
        if (selectedPeriod === "today") return startOfDay(now);
        if (selectedPeriod === "week") return subDays(now, 7);
        if (selectedPeriod === "month") return subDays(now, 30);
        return subDays(now, 365);
      })();

      const ranking: RankingUser[] = profiles
        .filter((p) => p.name !== "...") // skip unresolved profiles
        .map((profile) => {
          const memberTasks = tasks.filter((t) => {
            const isOwner =
              t.assignedTo === profile.id ||
              t.completedBy === profile.id ||
              t.createdBy === profile.id;
            if (!isOwner) return false;
            try {
              return isAfter(parseISO(t.createdAt), periodBoundary);
            } catch {
              return false;
            }
          });
          const completedTasks = memberTasks.filter(
            (t) => t.status === "completed",
          ).length;
          const totalTasks = memberTasks.length;
          const completionRate =
            totalTasks > 0
              ? Math.round((completedTasks / totalTasks) * 100)
              : 0;
          return {
            userId: profile.id,
            name: profile.name,
            email: profile.email,
            photoURL: profile.photoURL,
            completedTasks,
            totalTasks,
            completionRate,
            trend: 0,
            rank: 0,
            previousRank: 0,
          };
        })
        .filter((r) => r.totalTasks > 0); // only include users with real activity

      ranking.sort((a, b) =>
        b.completedTasks !== a.completedTasks
          ? b.completedTasks - a.completedTasks
          : b.completionRate - a.completionRate,
      );
      ranking.forEach((r, i) => {
        r.rank = i + 1;
        r.previousRank = i + 1;
      });

      setRankingData(ranking);
      setLoading(false);
    };

    generateRankingData();
  }, [user, teams, currentTeam, tasks, selectedPeriod, selectedTeam]);

  if (!user) return null;

  const currentUserRanking = rankingData.find((r) => r.userId === user.id);
  const topThree = rankingData.slice(0, 3);
  const restOfRanking = rankingData.slice(3);

  return (
    <>
      <Header
        title="Ranking de Productividad"
        description={
          currentTeam
            ? `Ranking del equipo ${currentTeam.name}`
            : "Ranking general de todos los equipos"
        }
        showMenuButton={true}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {teams.length > 0 && (
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg max-w-[140px] sm:max-w-none"
                style={{
                  border: "1px solid var(--border-input)",
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-primary)",
                }}
              >
                <option value="all">Todos los equipos</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            )}
            <select
              value={selectedPeriod}
              onChange={(e) =>
                setSelectedPeriod(
                  e.target.value as "today" | "week" | "month" | "year",
                )
              }
              className="px-3 py-2 text-sm rounded-lg"
              style={{
                backgroundColor: "var(--bg-card)",
                borderColor: "var(--border-color)",
                color: "var(--text-primary)",
                borderWidth: "1px",
                borderStyle: "solid",
              }}
            >
              <option value="today">Hoy</option>
              <option value="week">Semana</option>
              <option value="month">Mes</option>
              <option value="year">Año</option>
            </select>
          </div>
        }
      />

      <div className="p-3 sm:p-4 md:p-8 space-y-6 max-w-[1200px] mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {topThree.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
              >
                {topThree.map((user, index) => (
                  <motion.div
                    key={user.userId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="relative p-6 rounded-2xl border text-center"
                    style={
                      index === 0
                        ? {
                            backgroundColor: "rgba(253,224,71,0.12)",
                            borderColor: "rgba(234,179,8,0.35)",
                          }
                        : index === 1
                          ? {
                              backgroundColor: "rgba(156,163,175,0.1)",
                              borderColor: "rgba(156,163,175,0.35)",
                            }
                          : {
                              backgroundColor: "rgba(251,191,36,0.1)",
                              borderColor: "rgba(217,119,6,0.35)",
                            }
                    }
                  >
                    {/* Medal Icon */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <div
                        className={cn(
                          "w-16 h-16 rounded-full flex items-center justify-center shadow-lg",
                          index === 0 &&
                            "bg-gradient-to-br from-yellow-400 to-orange-500",
                          index === 1 &&
                            "bg-gradient-to-br from-gray-400 to-slate-500",
                          index === 2 &&
                            "bg-gradient-to-br from-amber-400 to-yellow-500",
                        )}
                      >
                        <span className="text-2xl">
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-8">
                      <div
                        className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-2xl font-bold shadow-lg"
                        style={{ color: "var(--text-on-accent)" }}
                      >
                        {user.name.charAt(0)}
                      </div>
                      <h3
                        className="text-xl font-bold mb-2"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {user.name}
                      </h3>
                      <p
                        className="text-3xl font-bold mb-1"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {user.completedTasks}
                      </p>
                      <p
                        className="text-sm mb-3"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        tareas completadas
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <Target
                          size={16}
                          style={{ color: "var(--text-tertiary)" }}
                        />
                        <span
                          className="text-lg font-semibold"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {user.completionRate}%
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Rest of Ranking */}
            {restOfRanking.length > 0 && (
              <div className="space-y-3">
                <h3
                  className="text-lg font-semibold mb-4"
                  style={{ color: "var(--text-primary)" }}
                >
                  Resto del ranking
                </h3>
                {restOfRanking.map((user) => (
                  <RankingCard
                    key={user.userId}
                    user={user}
                    isCurrentUser={false}
                    showMedal={false}
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {rankingData.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: "var(--bg-secondary)" }}
                >
                  <Trophy size={32} style={{ color: "var(--text-muted)" }} />
                </div>
                <h3
                  className="text-xl font-semibold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Sin datos de ranking
                </h3>
                <p
                  className="max-w-sm mx-auto"
                  style={{ color: "var(--text-secondary)" }}
                >
                  No hay suficiente actividad para mostrar el ranking en este
                  período.
                </p>
              </motion.div>
            )}
          </>
        )}
      </div>
    </>
  );
}
