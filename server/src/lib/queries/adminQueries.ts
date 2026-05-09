import { query, queryOne } from "../database.js";

export const getAdminStats = async () => {
  const stats = await queryOne(`
    SELECT
      (SELECT COUNT(*) FROM "Exams") as "totalExams",
      (SELECT COUNT(*) FROM "Attempts") as "totalAttempts",
      (SELECT COUNT(*) FROM "Users" WHERE role = 'student') as "totalStudents",
      (SELECT AVG(score) FROM "Attempts") as "averageScore"
  `);

  let unreadNotifications = 0;
  try {
    const notificationStats = await queryOne(`
      SELECT COUNT(*) as "unreadNotifications"
      FROM "Notifications"
      WHERE "isRead" = FALSE
    `);
    unreadNotifications = Number(notificationStats?.unreadNotifications ?? 0);
  } catch (error) {
    unreadNotifications = 0;
  }

  const recentAttempts = await query(`
    SELECT
      a.id,
      a.score,
      a."submittedAt",
      u.name as "studentName",
      e.title as "examTitle"
    FROM "Attempts" a
    JOIN "Users" u ON a."studentId" = u.id
    JOIN "Exams" e ON a."examId" = e.id
    ORDER BY a."submittedAt" DESC
    LIMIT 5
  `);

  return {
    totalExams: Number(stats?.totalExams ?? 0),
    totalAttempts: Number(stats?.totalAttempts ?? 0),
    totalStudents: Number(stats?.totalStudents ?? 0),
    unreadNotifications,
    averageScore: stats?.averageScore === null || stats?.averageScore === undefined ? null : Number(stats.averageScore),
    recentAttempts,
  };
};

export const getAdminSystemStatus = async () => {
  const [stats, system] = await Promise.all([
    getAdminStats(),
    queryOne(`
      SELECT
        current_database() as "databaseName",
        TO_CHAR(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as "serverTime",
        version() as "sqlVersion"
    `),
  ]);

  return {
    apiStatus: "ok",
    databaseName: system?.databaseName ?? null,
    serverTime: system?.serverTime ?? new Date().toISOString(),
    sqlVersion: system?.sqlVersion ?? null,
    stats,
  };
};
