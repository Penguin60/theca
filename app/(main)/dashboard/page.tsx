import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getVariablesByUserId } from "@/server/queries";
import { VariableTable } from "./variable-table";
import { CreateVariable } from "./create-variable";
import { UserMenu } from "./user-menu";
import Navbar from "@/components/navbar";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const vars = await getVariablesByUserId(session.user.id);
  const username = session.user.username;

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <Navbar />
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
