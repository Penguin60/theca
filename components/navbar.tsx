import { UserMenu } from "@/app/(main)/dashboard/user-menu";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Navbar() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  return (
    <>
      <div className="container mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
        <h1 className="text-lg font-semibold">Theca</h1>
        {session.user.image && (
          <UserMenu
            image={session.user.image}
            name={session.user.name ?? "Profile"}
          />
        )}
      </div>
    </>
  );
}
