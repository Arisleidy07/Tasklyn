// ============================================
// TASKLYN - Recognition Service
// Automatic achievement detection and notifications
// ============================================

import {
  createAchievement,
  subscribeToTeamAchievements,
  subscribeToUserAchievements,
} from "@/lib/firestore";
import { notifyUser } from "@/lib/notify";
import type { Achievement, Team, Task } from "@/types";

export interface RecognitionEvent {
  type:
    | "task_completed"
    | "goal_achieved"
    | "milestone_reached"
    | "streak_maintained";
  userId: string;
  teamId?: string;
  data: any;
}

export interface AchievementTemplate {
  type: "daily_top" | "weekly_top" | "monthly_top" | "milestone";
  title: string;
  description: string;
  icon: string;
  points: number;
}

class RecognitionService {
  private static instance: RecognitionService;
  private achievementTemplates: AchievementTemplate[] = [
    {
      type: "daily_top",
      title: "🌟 Estrella del Día",
      description: "¡El miembro más productivo hoy!",
      icon: "⭐",
      points: 100,
    },
    {
      type: "weekly_top",
      title: "🏆 Campeón Semanal",
      description: "¡El mejor rendimiento de la semana!",
      icon: "🏆",
      points: 500,
    },
    {
      type: "monthly_top",
      title: "👑 Leyenda del Mes",
      description: "¡Rendimiento excepcional este mes!",
      icon: "👑",
      points: 1000,
    },
    {
      type: "milestone",
      title: "🎯 Hito Alcanzado",
      description: "¡Has alcanzado un nuevo hito!",
      icon: "🎯",
      points: 250,
    },
  ];

  static getInstance(): RecognitionService {
    if (!RecognitionService.instance) {
      RecognitionService.instance = new RecognitionService();
    }
    return RecognitionService.instance;
  }

  /**
   * Process task completion and check for achievements
   */
  async processTaskCompletion(
    task: Task,
    completedBy: string,
    performedBy?: string,
  ): Promise<void> {
    console.log(`🏆 Processing task completion for user: ${completedBy}`);

    // Check for streak achievements
    await this.checkStreakAchievements(completedBy, task.teamId);

    // Check for milestone achievements
    await this.checkMilestoneAchievements(completedBy, task.teamId);

    // Create completion notification
    await this.createCompletionNotification(task, completedBy, performedBy);
  }

  /**
   * Check and award daily/weekly/monthly top performers
   */
  async calculateTopPerformers(
    teamId: string,
    period: "daily" | "weekly" | "monthly",
  ): Promise<void> {
    console.log(
      `🏆 Calculating top performers for team: ${teamId}, period: ${period}`,
    );

    // This would typically involve:
    // 1. Querying task completion data for the period
    // 2. Calculating performance metrics
    // 3. Determining top performers
    // 4. Creating achievements and notifications

    // Mock implementation for demonstration
    const mockTopPerformer = {
      userId: "mock-user-id",
      completedTasks: 25,
      completionRate: 95,
    };

    const template = this.achievementTemplates.find((t) =>
      period === "daily"
        ? t.type === "daily_top"
        : period === "weekly"
          ? t.type === "weekly_top"
          : t.type === "monthly_top",
    );

    if (template) {
      await this.createAchievement({
        userId: mockTopPerformer.userId,
        teamId,
        type: template.type as any,
        title: template.title,
        description: `${template.description} ${mockTopPerformer.completedTasks} tareas completadas con ${mockTopPerformer.completionRate}% de tasa de cumplimiento.`,
        value: mockTopPerformer.completedTasks,
        period: new Date().toISOString().split("T")[0],
      });

      await this.createRecognitionNotification(
        mockTopPerformer.userId,
        teamId,
        template.title,
        template.description,
        "achievement",
      );
    }
  }

  /**
   * Check for streak achievements
   */
  private async checkStreakAchievements(
    userId: string,
    teamId?: string,
  ): Promise<void> {
    // Mock streak detection
    const currentStreak = 7; // This would be calculated from actual data

    if (currentStreak >= 7) {
      await this.createAchievement({
        userId,
        teamId: teamId!,
        type: "milestone",
        title: "🔥 Racha de 7 Días",
        description: "¡Has completado tareas durante 7 días consecutivos!",
        value: currentStreak,
        period: new Date().toISOString().split("T")[0],
      });

      await this.createRecognitionNotification(
        userId,
        teamId!,
        "🔥 ¡Racha Impresionante!",
        "Has mantenido una racha de 7 días completando tareas. ¡Sigue así!",
        "streak",
      );
    }
  }

  /**
   * Check for milestone achievements
   */
  private async checkMilestoneAchievements(
    userId: string,
    teamId?: string,
  ): Promise<void> {
    // Mock milestone detection (would query actual task count)
    const totalCompletedTasks = 100;

    const milestones = [10, 25, 50, 100, 250, 500, 1000];
    const nextMilestone = milestones.find((m) => totalCompletedTasks >= m);

    if (nextMilestone && totalCompletedTasks === nextMilestone) {
      await this.createAchievement({
        userId,
        teamId: teamId!,
        type: "milestone",
        title: `🎯 ${nextMilestone} Tareas Completadas`,
        description: `¡Has alcanzado el hito de ${nextMilestone} tareas completadas!`,
        value: nextMilestone,
        period: new Date().toISOString().split("T")[0],
      });

      await this.createRecognitionNotification(
        userId,
        teamId!,
        "🎯 ¡Nuevo Hito Alcanzado!",
        `¡Felicidades! Has completado ${nextMilestone} tareas. Tu dedicación es impresionante.`,
        "milestone",
      );
    }
  }

  /**
   * Create an achievement record
   */
  private async createAchievement(
    achievementData: Omit<Achievement, "id" | "createdAt">,
  ): Promise<string> {
    try {
      const achievementId = await createAchievement(achievementData);
      console.log(`✅ Achievement created: ${achievementId}`);
      return achievementId;
    } catch (error) {
      console.error("Failed to create achievement:", error);
      throw error;
    }
  }

  /**
   * Create a recognition notification
   */
  private async createRecognitionNotification(
    userId: string,
    teamId: string,
    title: string,
    body: string,
    type: string,
  ): Promise<void> {
    try {
      await notifyUser({
        userId,
        type: "task_completed" as any, // Could add new notification types
        title,
        body,
        data: {
          type: "recognition",
          category: type,
          teamId,
        },
      });
      console.log(`✅ Recognition notification created for user: ${userId}`);
    } catch (error) {
      console.error("Failed to create recognition notification:", error);
    }
  }

  /**
   * Create task completion notification
   */
  private async createCompletionNotification(
    task: Task,
    completedBy: string,
    performedBy?: string,
  ): Promise<void> {
    try {
      let title = "✅ Tarea Completada";
      let body = `La tarea "${task.title}" ha sido completada.`;

      if (performedBy && performedBy !== completedBy) {
        title = "🤝 Tarea Completada en Equipo";
        body = `La tarea "${task.title}" fue completada por el equipo.`;
      }

      await notifyUser({
        userId: completedBy,
        type: "task_completed",
        title,
        body,
        data: {
          taskId: task.id,
          listId: task.listId,
          ...(performedBy && { performedBy }),
        },
      });
    } catch (error) {
      console.error("Failed to create completion notification:", error);
    }
  }

  /**
   * Send weekly team recognition summary
   */
  async sendWeeklyRecognitionSummary(
    teamId: string,
    team: Team,
  ): Promise<void> {
    console.log(`📧 Sending weekly recognition summary for team: ${teamId}`);

    // Mock weekly summary
    const summaryData = {
      topPerformer: {
        name: "Pedro Martínez",
        completedTasks: 45,
        achievement: "🏆 Campeón Semanal",
      },
      totalTasksCompleted: 156,
      teamCompletionRate: 87,
      newAchievements: 8,
    };

    // Notify all team members
    for (const member of team.members) {
      await notifyUser({
        userId: member.userId,
        type: "task_completed" as any,
        title: "📊 Resumen Semanal del Equipo",
        body: `Este semana completamos ${summaryData.totalTasksCompleted} tareas con ${summaryData.teamCompletionRate}% de tasa de cumplimiento. ¡Felicidades ${summaryData.topPerformer.name} por ser el campeón semanal!`,
        data: {
          type: "weekly_summary",
          summary: JSON.stringify(summaryData),
        },
      });
    }
  }

  /**
   * Check for goal achievements
   */
  async checkGoalAchievements(goalId: string, goalData: any): Promise<void> {
    if (goalData.currentValue >= goalData.targetValue && !goalData.achieved) {
      // Goal achieved!
      await this.createAchievement({
        userId: goalData.createdBy,
        teamId: goalData.teamId,
        type: "milestone",
        title: "🎯 Meta Alcanzada",
        description: `¡Felicidades! Has alcanzado la meta: "${goalData.title}"`,
        value: goalData.targetValue,
        period: new Date().toISOString().split("T")[0],
      });

      await this.createRecognitionNotification(
        goalData.createdBy,
        goalData.teamId,
        "🎯 ¡Meta Alcanzada!",
        `¡Excelente trabajo! Has completado la meta: "${goalData.title}"`,
        "goal",
      );
    }
  }

  /**
   * Get user achievements
   */
  subscribeToUserAchievements(
    userId: string,
    callback: (achievements: Achievement[]) => void,
  ) {
    return subscribeToUserAchievements(userId, callback);
  }

  /**
   * Get team achievements
   */
  subscribeToTeamAchievements(
    teamId: string,
    callback: (achievements: Achievement[]) => void,
  ) {
    return subscribeToTeamAchievements(teamId, callback);
  }
}

export const recognitionService = RecognitionService.getInstance();
