import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getVariablesByUserId, getFoldersByUserId } from "@/server/queries";
import { VariableTable } from "./variable-table";
import { CreateVariable } from "./create-variable";
import { FolderSwitcher } from "./folder-switcher";
import Navbar from "@/components/navbar";

type SearchParams = Promise<{ folder?: string }>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const { folder: folderParam } = await searchParams;

  const folders = await getFoldersByUserId(session.user.id);

  let selectedFolderId: string | "none" | null = null;
  let filter: { folderId: string | null } | undefined;

  if (folderParam === "none") {
    selectedFolderId = "none";
    filter = { folderId: null };
  } else if (folderParam) {
    const match = folders.find((f) => f.id === folderParam);
    if (match) {
      selectedFolderId = match.id;
      filter = { folderId: match.id };
    }
  }

  const vars = await getVariablesByUserId(session.user.id, filter);
  const username = session.user.username;

  const defaultFolderId =
    selectedFolderId && selectedFolderId !== "none" ? selectedFolderId : null;

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <Navbar>
          <FolderSwitcher
            folders={folders}
            selectedFolderId={selectedFolderId}
          />
        </Navbar>
      </header>
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Public URL format:{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              /v/{username}/your-key
            </code>
          </p>
          <CreateVariable
            folders={folders}
            defaultFolderId={defaultFolderId}
          />
        </div>
        <VariableTable
          variables={vars}
          username={username}
          folders={folders}
        />
      </main>
    </div>
  );
}
