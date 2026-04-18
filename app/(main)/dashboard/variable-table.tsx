"use client";

import { useMemo, useRef, useState, useTransition, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  updateVariable,
  deleteVariable,
  moveVariableToFolder,
  deleteVariables,
  moveVariablesToFolder,
} from "@/server/actions";
import {
  Copy,
  Trash2,
  Pencil,
  FolderInput,
  Inbox,
  Folder,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";

interface Variable {
  id: string;
  key: string;
  value: string;
  folderId: string | null;
  updatedAt: Date;
}

interface FolderItem {
  id: string;
  name: string;
}

export function VariableTable({
  variables,
  username,
  folders,
}: {
  variables: Variable[];
  username: string;
  folders: FolderItem[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const allIds = useMemo(() => variables.map((v) => v.id), [variables]);
  const selectedCount = selected.size;
  const allSelected = selectedCount > 0 && selectedCount === allIds.length;
  const someSelected = selectedCount > 0 && !allSelected;

  useEffect(() => {
    if (selected.size === 0) return;
    const valid = new Set(allIds);
    let changed = false;
    const next = new Set<string>();
    for (const id of selected) {
      if (valid.has(id)) next.add(id);
      else changed = true;
    }
    if (changed) setSelected(next);
  }, [allIds, selected]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === allIds.length ? new Set() : new Set(allIds)
    );
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function handleBulkDelete() {
    const ids = Array.from(selected);
    if (!confirm(`Delete ${ids.length} variable${ids.length === 1 ? "" : "s"}?`))
      return;
    startTransition(async () => {
      const result = await deleteVariables(ids);
      if (result?.error) {
        toast.error("Failed to delete variables");
      } else {
        toast.success(`Deleted ${ids.length} variable${ids.length === 1 ? "" : "s"}`);
        clearSelection();
      }
    });
  }

  function handleBulkMove(folderId: string | null) {
    const ids = Array.from(selected);
    startTransition(async () => {
      const result = await moveVariablesToFolder(ids, folderId);
      if (result?.error) {
        toast.error("Failed to move variables");
      } else {
        toast.success(
          folderId
            ? `Moved ${ids.length} to folder`
            : `Moved ${ids.length} to uncategorized`
        );
        clearSelection();
      }
    });
  }

  if (variables.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-12 text-center">
        <p className="text-muted-foreground">
          No variables yet. Create your first one to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">
              <HeaderCheckbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={toggleAll}
              />
            </TableHead>
            <TableHead>Key</TableHead>
            <TableHead>Value</TableHead>
            <TableHead className="w-[60px]">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      disabled={selectedCount === 0 || isPending}
                      aria-label={
                        selectedCount > 0
                          ? `Actions for ${selectedCount} selected`
                          : "Bulk actions"
                      }
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <FolderInput className="h-4 w-4" />
                      Move to
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => handleBulkMove(null)}>
                        <Inbox className="h-4 w-4" />
                        Uncategorized
                      </DropdownMenuItem>
                      {folders.length > 0 && <DropdownMenuSeparator />}
                      {folders.map((f) => (
                        <DropdownMenuItem
                          key={f.id}
                          onClick={() => handleBulkMove(f.id)}
                        >
                          <Folder className="h-4 w-4" />
                          {f.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete {selectedCount}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {variables.map((v) => (
            <VariableRow
              key={v.id}
              variable={v}
              username={username}
              folders={folders}
              selected={selected.has(v.id)}
              onToggle={() => toggle(v.id)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function HeaderCheckbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label="Select all"
      className="h-4 w-4 cursor-pointer accent-foreground"
    />
  );
}

function VariableRow({
  variable,
  username,
  folders,
  selected,
  onToggle,
}: {
  variable: Variable;
  username: string;
  folders: FolderItem[];
  selected: boolean;
  onToggle: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const publicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/v/${username}/${variable.key}`;

  function handleCopy() {
    navigator.clipboard.writeText(publicUrl);
    toast.success("URL copied to clipboard");
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteVariable(variable.id);
      if (result?.error) {
        toast.error("Failed to delete variable");
      } else {
        toast.success("Variable deleted");
      }
    });
  }

  function handleMove(folderId: string | null) {
    startTransition(async () => {
      const result = await moveVariableToFolder(variable.id, folderId);
      if (result?.error) {
        toast.error("Failed to move variable");
      } else {
        toast.success(folderId ? "Moved to folder" : "Removed from folder");
      }
    });
  }

  return (
    <>
      <EditValueDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        variable={variable}
      />
    <TableRow data-state={selected ? "selected" : undefined}>
      <TableCell>
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          aria-label={`Select ${variable.key}`}
          className="h-4 w-4 cursor-pointer accent-foreground"
        />
      </TableCell>
      <TableCell className="font-mono text-sm">{variable.key}</TableCell>
      <TableCell>
        <span className="block truncate max-w-[300px]">{variable.value}</span>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                disabled={isPending}
                aria-label="Actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Edit value
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopy}>
              <Copy className="h-4 w-4" />
              Copy URL
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FolderInput className="h-4 w-4" />
                Move to
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  onClick={() => handleMove(null)}
                  disabled={variable.folderId === null}
                >
                  <Inbox className="h-4 w-4" />
                  Uncategorized
                </DropdownMenuItem>
                {folders.length > 0 && <DropdownMenuSeparator />}
                {folders.map((f) => (
                  <DropdownMenuItem
                    key={f.id}
                    onClick={() => handleMove(f.id)}
                    disabled={variable.folderId === f.id}
                  >
                    <Folder className="h-4 w-4" />
                    {f.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
    </>
  );
}

function EditValueDialog({
  open,
  onOpenChange,
  variable,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  variable: Variable;
}) {
  const [value, setValue] = useState(variable.value);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) setValue(variable.value);
  }, [open, variable.value]);

  function handleSave() {
    startTransition(async () => {
      const result = await updateVariable(variable.id, value);
      if (result?.error) {
        toast.error("Failed to update variable");
      } else {
        toast.success("Variable updated");
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit value</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`key-${variable.id}`}>Key</Label>
            <Input
              id={`key-${variable.id}`}
              value={variable.key}
              readOnly
              disabled
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`value-${variable.id}`}>Value</Label>
            <Input
              id={`value-${variable.id}`}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
            />
          </div>
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={isPending || value === variable.value}
          >
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
