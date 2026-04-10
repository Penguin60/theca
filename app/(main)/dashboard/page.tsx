import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getVariablesByUserId } from "@/server/queries";
import { VariableTable } from "./variable-table";
import { CreateVariable } from "./create-variable";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const vars = await getVariablesByUserId(session.user.id);
  const username = session.user.username;

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-semibold">Variable Store</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {session.user.name ?? session.user.email}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Your Variables</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Public URL format:{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                /v/{username}/your-key
              </code>
            </p>
          </div>
          <CreateVariable />
        </div>
        <VariableTable variables={vars} username={username} />
      </main>
    </div>
  );
}
