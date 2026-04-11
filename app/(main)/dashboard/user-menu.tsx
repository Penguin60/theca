"use client";

import Image from "next/image";
import { LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/server/actions";

export function UserMenu({
  image,
  name,
}: {
  image: string;
  name: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button className="rounded-full outline-none hover:cursor-pointer ring-offset-background transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Image
              src={image}
              alt={name}
              width={32}
              height={32}
              className="rounded-full"
            />
          </button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          variant="destructive"
          onClick={() => signOutAction()}
        >
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
