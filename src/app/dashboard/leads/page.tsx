import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function LeadsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard/leads");
  }

  const leads = await prisma.lead.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { project: { select: { title: true, slug: true } } },
  });

  return (
    <main className="bg-atmosphere min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/dashboard" className="font-[family-name:var(--font-brand)] text-2xl italic text-fog">
          magic ai
        </Link>
        <Link href="/dashboard" className="text-sm text-mist hover:text-fog">
          ← Dashboard
        </Link>
      </header>

      <div className="mx-auto max-w-4xl px-6 pb-20">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight">
          Lead inbox
        </h1>
        <p className="mt-2 text-mist">
          Contact form submissions from your published sites — like Durable&apos;s CRM lite.
        </p>

        {leads.length === 0 ? (
          <div className="mt-16 rounded-3xl border border-dashed border-[var(--line)] px-8 py-16 text-center">
            <p className="text-lg text-fog">No leads yet</p>
            <p className="mt-2 text-sm text-mist">
              Publish a site with a contact form. Submissions appear here automatically.
            </p>
          </div>
        ) : (
          <ul className="mt-10 space-y-4">
            {leads.map((lead) => (
              <li
                key={lead.id}
                className="rounded-2xl border border-[var(--line)] bg-ink-soft/80 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-fog">{lead.name}</p>
                    <a
                      href={`mailto:${lead.email}`}
                      className="text-sm text-lime hover:underline"
                    >
                      {lead.email}
                    </a>
                  </div>
                  <div className="text-right text-xs text-mist">
                    <p>{lead.project.title}</p>
                    {lead.project.slug ? (
                      <Link href={`/s/${lead.project.slug}`} className="hover:text-fog">
                        /s/{lead.project.slug}
                      </Link>
                    ) : null}
                    <p className="mt-1">
                      {new Date(lead.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-mist">{lead.message}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
