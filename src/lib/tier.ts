import { prisma } from "@/lib/db";

export const FREE_SITE_LIMIT = 3;

export type UserPlan = "free" | "pro";

export async function getUserPlan(userId: string): Promise<UserPlan> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  return user?.plan === "pro" ? "pro" : "free";
}

export async function countUserProjects(userId: string): Promise<number> {
  return prisma.project.count({ where: { userId } });
}

export async function assertCanCreateProject(userId: string): Promise<void> {
  const plan = await getUserPlan(userId);
  if (plan === "pro") return;
  const count = await countUserProjects(userId);
  if (count >= FREE_SITE_LIMIT) {
    throw new Error(
      `Free plan includes ${FREE_SITE_LIMIT} sites. Delete a project or upgrade to Pro for unlimited sites.`,
    );
  }
}

export function shouldWatermark(plan: UserPlan): boolean {
  return plan === "free";
}

export function canUseCustomDomain(plan: UserPlan): boolean {
  return plan === "pro";
}
