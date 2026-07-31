import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type SessionCheck =
  | { ok: true; userId: string }
  | { ok: false; status: 401; error: string };

/**
 * JWT sessions outlive the rows they point at, so a token issued before a
 * database reset still looks valid and then fails as a foreign key violation
 * on the first write. Confirm the user row exists before trusting the id.
 */
export async function requireUserId(): Promise<SessionCheck> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    return {
      ok: false,
      status: 401,
      error: "Your session is out of date. Please sign out and sign in again.",
    };
  }

  return { ok: true, userId: user.id };
}
