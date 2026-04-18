import { UserMenu } from "@/app/(main)/dashboard/user-menu";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Navbar({
  children,
}: {
  children?: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  return (
    <div className="container mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="text-lg font-semibold shrink-0">Theca</h1>
        {children && (
          <>
            <span className="text-muted-foreground/50 select-none" aria-hidden>
              /
            </span>
            {children}
          </>
        )}
      </div>
      {session.user.image && (
        <UserMenu
          image={session.user.image}
          name={session.user.name ?? "Profile"}
        />
      )}
    </div>
  );
}
