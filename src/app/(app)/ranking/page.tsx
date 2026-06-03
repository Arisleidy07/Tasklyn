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
  Calendar,
  Filter,
  Crown,
  Star,
  Target,
  Activity,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
        return <Medal size={20} className="text-gray-400" />;
      case 3:
        return <Award size={20} className="text-amber-600" />;
      default:
        return (
          <span className="text-lg font-bold text-gray-400 dark:text-slate-500">
            #{rank}
          </span>
        );
    }
  };

  const getMedalBg = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 dark:from-yellow-950/20 dark:to-orange-950/20 dark:border-yellow-800";
      case 2:
        return "bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200 dark:from-gray-950/20 dark:to-slate-950/20 dark:border-gray-800";
      case 3:
        return "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 dark:from-amber-950/20 dark:to-yellow-950/20 dark:border-amber-800";
      default:
        return "bg-white border-gray-200 dark:bg-slate-900 dark:border-slate-800";
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
      className={cn(
        "relative p-4 rounded-xl border transition-all duration-300",
        getMedalBg(user.rank),
        isCurrentUser &&
          "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900",
      )}
    >
      {isCurrentUser && (
        <div className="absolute -top-2 -right-2 px-2 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">
          Tú
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* Rank */}
        <div className="flex items-center justify-center w-12 h-12">
          {showMedal ? (
            getMedalIcon(user.rank)
          ) : (
            <span className="text-lg font-bold text-gray-600 dark:text-slate-400">
              #{user.rank}
            </span>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-slate-100">
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
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {user.completedTasks} tareas completadas
          </p>
        </div>

        {/* Stats */}
        <div className="text-right">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-bold text-gray-900 dark:text-slate-100">
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
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Tasa de cumplimiento
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3">
        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5">
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
        new Set([...teamMembers.map((m) => m.userId), user.id]),
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
                name: `Miembro ${uid.slice(0, 8)}`,
                email: "",
                photoURL: undefined,
              };
        }),
      );

      const ranking: RankingUser[] = profiles.map((profile) => {
        const memberTasks = tasks.filter(
          (t) => t.assignedTo === profile.id || t.completedBy === profile.id,
        );
        const completedTasks = memberTasks.filter(
          (t) => t.status === "completed",
        ).length;
        const totalTasks = memberTasks.length;
        const completionRate =
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
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
      });

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
          <div className="flex items-center gap-2">
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
            >
              <option value="all">Todos los equipos</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
            >
              <option value="today">Hoy</option>
              <option value="week">Semana</option>
              <option value="month">Mes</option>
              <option value="year">Año</option>
            </select>
            <Button variant="ghost" size="sm">
              <Filter size={14} />
            </Button>
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
                    className={cn(
                      "relative p-6 rounded-2xl border text-center",
                      index === 0 &&
                        "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 dark:from-yellow-950/20 dark:to-orange-950/20 dark:border-yellow-800",
                      index === 1 &&
                        "bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200 dark:from-gray-950/20 dark:to-slate-950/20 dark:border-gray-800",
                      index === 2 &&
                        "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 dark:from-amber-950/20 dark:to-yellow-950/20 dark:border-amber-800",
                    )}
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
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                        {user.name.charAt(0)}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">
                        {user.name}
                      </h3>
                      <p className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-1">
                        {user.completedTasks}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">
                        tareas completadas
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <Target size={16} className="text-gray-400" />
                        <span className="text-lg font-semibold text-gray-700 dark:text-slate-300">
                          {user.completionRate}%
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Current User Highlight */}
            {currentUserRanking && currentUserRanking.rank > 3 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-6"
              >
                <RankingCard
                  user={currentUserRanking}
                  isCurrentUser={true}
                  showMedal={false}
                />
              </motion.div>
            )}

            {/* Rest of Ranking */}
            {restOfRanking.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
                  Resto del ranking
                </h3>
                {restOfRanking.map((user, index) => (
                  <RankingCard
                    key={user.userId}
                    user={user}
                    isCurrentUser={user.userId === currentUserRanking?.userId}
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
                <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <Trophy
                    size={32}
                    className="text-gray-400 dark:text-slate-500"
                  />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
                  Sin datos de ranking
                </h3>
                <p className="text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
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
