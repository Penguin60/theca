import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="max-w-md space-y-6 text-center">
        <h1 className="text-4xl font-bold">Variable Store</h1>
        <p className="text-lg text-muted-foreground">
          Create named variables and share them via public URLs that return
          plain text. Update a value in the dashboard and the URL reflects it
          instantly.
        </p>
        <Link
          href="/signin"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
}
