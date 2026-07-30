import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main className="bg-atmosphere min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-brand)] text-3xl italic text-fog"
        >
          magic ai
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-mist sm:inline">
            {session.user.email}
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="rounded-full border border-[var(--line)] px-4 py-2 text-sm text-mist transition hover:text-fog"
            >
              Sign out
            </button>
          </form>
          <Link
            href="/builder"
            className="rounded-full bg-lime px-5 py-2.5 text-sm font-semibold text-ink"
          >
            New site
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 pb-20">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight">
          Your projects
        </h1>
        <p className="mt-2 text-mist">
          Open a project to refine with AI or publish with one click.
        </p>

        {projects.length === 0 ? (
          <div className="mt-16 rounded-3xl border border-dashed border-[var(--line)] px-8 py-16 text-center">
            <p className="text-lg text-fog">No sites yet</p>
            <p className="mt-2 text-sm text-mist">
              Describe what you want to build and Magic AI will generate it.
            </p>
            <Link
              href="/builder"
              className="mt-6 inline-flex rounded-full bg-lime px-6 py-3 text-sm font-semibold text-ink"
            >
              Start building
            </Link>
          </div>
        ) : (
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/builder/${p.id}`}
                  className="block rounded-2xl border border-[var(--line)] bg-ink-soft/80 p-5 transition hover:border-lime/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-[family-name:var(--font-display)] text-lg font-bold leading-snug">
                      {p.title}
                    </h2>
                    {p.published ? (
                      <span className="shrink-0 rounded-full bg-lime/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-lime">
                        Live
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-mist">
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-mist">{p.prompt}</p>
                  <div className="mt-4 flex items-center justify-between text-xs text-mist">
                    <span className="uppercase tracking-wider">{p.provider}</span>
                    <span>
                      {new Date(p.updatedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
