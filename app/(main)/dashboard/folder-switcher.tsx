"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createFolder, deleteFolder } from "@/server/actions";
import {
  ChevronsUpDown,
  Folder,
  Inbox,
  List,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface FolderItem {
  id: string;
  name: string;
}

export function FolderSwitcher({
  folders,
  selectedFolderId,
}: {
  folders: FolderItem[];
  selectedFolderId: string | "none" | null;
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);

  const current =
    selectedFolderId === "none"
      ? { icon: <Inbox className="h-4 w-4" />, label: "Uncategorized" }
      : selectedFolderId
        ? {
            icon: <Folder className="h-4 w-4" />,
            label:
              folders.find((f) => f.id === selectedFolderId)?.name ?? "Folder",
          }
        : { icon: <List className="h-4 w-4" />, label: "All" };

  function navigate(href: string) {
    router.push(href);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent transition-colors min-w-0"
            >
              {current.icon}
              <span className="truncate font-medium">{current.label}</span>
              <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </button>
          }
        />
        <DropdownMenuContent align="start" className="min-w-56">
          <DropdownMenuItem onClick={() => navigate("/dashboard")}>
            <List className="h-4 w-4" />
            All
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/dashboard?folder=none")}>
            <Inbox className="h-4 w-4" />
            Uncategorized
          </DropdownMenuItem>
          {folders.length > 0 && <DropdownMenuSeparator />}
          {folders.map((f) => (
            <FolderMenuItem
              key={f.id}
              folder={f}
              onSelect={() => navigate(`/dashboard?folder=${f.id}`)}
            />
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New folder
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CreateFolderDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}

function FolderMenuItem({
  folder,
  onSelect,
}: {
  folder: FolderItem;
  onSelect: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (
      !confirm(
        `Delete folder "${folder.name}"? Variables inside will become uncategorized.`
      )
    )
      return;
    startTransition(async () => {
      const result = await deleteFolder(folder.id);
      if (result?.error) {
        toast.error("Failed to delete folder");
      } else {
        toast.success("Folder deleted");
      }
    });
  }

  return (
    <DropdownMenuItem onClick={onSelect} className="group/folder">
      <Folder className="h-4 w-4" />
      <span className="flex-1 truncate">{folder.name}</span>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="opacity-0 group-hover/folder:opacity-100 text-destructive transition-opacity"
        aria-label={`Delete folder ${folder.name}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </DropdownMenuItem>
  );
}

function CreateFolderDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  function handleSubmit(formData: FormData) {
    setErrors({});
    startTransition(async () => {
      const result = await createFolder(formData);
      if (result?.error) {
        setErrors(result.error as Record<string, string[]>);
      } else {
        onOpenChange(false);
        toast.success("Folder created");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Folder</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="My folder"
              maxLength={64}
              required
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name[0]}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating..." : "Create"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
