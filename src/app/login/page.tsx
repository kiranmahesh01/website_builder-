import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="bg-atmosphere flex min-h-screen flex-col">
      <header className="px-6 py-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-brand)] text-3xl italic text-fog"
        >
          magic ai
        </Link>
      </header>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pb-16">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-mist">
          Log in to continue building and publishing sites.
        </p>
        <Suspense fallback={<div className="mt-8 h-48 animate-pulse rounded-xl bg-ink-soft" />}>
          <LoginForm />
        </Suspense>
        <p className="mt-6 text-sm text-mist">
          New here?{" "}
          <Link href="/signup" className="text-lime hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
