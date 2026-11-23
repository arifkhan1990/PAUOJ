import { errors } from "@/server/api/errors";
import { getRedis } from "@/server/redis";
import { SQL_LAB_TASKS } from "@/lib/sql-lab/tasks";

function progressKey(userId: string): string {
  return `sql-lab:completed:${userId}`;
}

export async function getSqlLabProgress(userId: string): Promise<string[]> {
  try {
    return await getRedis().smembers(progressKey(userId));
  } catch {
    return [];
  }
}

export async function completeSqlLabTask(
  userId: string,
  taskId: string,
): Promise<string[]> {
  const task = SQL_LAB_TASKS.find((item) => item.id === taskId);
  if (!task) throw errors.notFound("Task not found.");
  try {
    await getRedis().sadd(progressKey(userId), taskId);
    return await getRedis().smembers(progressKey(userId));
  } catch {
    throw errors.unavailable("Could not save your progress. Try again.");
  }
}
