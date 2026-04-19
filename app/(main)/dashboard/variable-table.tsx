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
  Image as ImageIcon,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { SvgUrlDialog } from "./svg-url-dialog";

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
  createSlot,
}: {
  variables: Variable[];
  username: string;
  folders: FolderItem[];
  createSlot?: React.ReactNode;
}) {
  const PAGE_SIZE = 10;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const filteredVariables = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return variables;
    return variables.filter(
      (v) =>
        v.key.toLowerCase().includes(q) ||
        v.value.toLowerCase().includes(q)
    );
  }, [variables, search]);

  const totalPages = Math.max(1, Math.ceil(filteredVariables.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageVariables = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredVariables.slice(start, start + PAGE_SIZE);
  }, [filteredVariables, page]);

  const pageIds = useMemo(() => pageVariables.map((v) => v.id), [pageVariables]);
  const allKnownIds = useMemo(() => variables.map((v) => v.id), [variables]);

  const selectedCount = selected.size;
  const visibleSelectedCount = pageIds.filter((id) => selected.has(id)).length;
  const allSelected =
    pageIds.length > 0 && visibleSelectedCount === pageIds.length;
  const someSelected = visibleSelectedCount > 0 && !allSelected;

  useEffect(() => {
    if (selected.size === 0) return;
    const valid = new Set(allKnownIds);
    let changed = false;
    const next = new Set<string>();
    for (const id of selected) {
      if (valid.has(id)) next.add(id);
      else changed = true;
    }
    if (changed) setSelected(next);
  }, [allKnownIds, selected]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
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
      <div className="space-y-3">
        {createSlot && <div className="flex justify-end">{createSlot}</div>}
        <div className="rounded-md border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            No variables yet. Create your first one to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search variables..."
            className="h-10 pl-8"
          />
        </div>
        {createSlot}
      </div>
      {filteredVariables.length === 0 ? (
        <div className="rounded-md border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No variables match your search.</p>
        </div>
      ) : (
        <>
    <div className="rounded-md border">
      <Table className="text-[15px] [&_td]:py-3">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">
              <div className="flex items-center">
                <HeaderCheckbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={toggleAll}
                />
              </div>
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
                      className="h-8 w-8 cursor-pointer"
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
          {pageVariables.map((v) => (
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
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredVariables.length} variable
              {filteredVariables.length === 1 ? "" : "s"}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
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
  const [svgOpen, setSvgOpen] = useState(false);
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
      <SvgUrlDialog
        open={svgOpen}
        onOpenChange={setSvgOpen}
        username={username}
        variableKey={variable.key}
      />
    <TableRow data-state={selected ? "selected" : undefined}>
      <TableCell>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            aria-label={`Select ${variable.key}`}
            className="h-4 w-4 cursor-pointer accent-foreground"
          />
        </div>
      </TableCell>
      <TableCell className="font-mono">{variable.key}</TableCell>
      <TableCell>
        <span
          onClick={handleCopy}
          className="inline-block max-w-[300px] cursor-pointer truncate align-middle hover:text-muted-foreground"
          title="Click to copy URL"
        >
          {variable.value}
        </span>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 cursor-pointer"
                disabled={isPending}
                aria-label="Actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Edit value
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopy}>
              <Copy className="h-4 w-4" />
              Copy URL
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSvgOpen(true)}>
              <ImageIcon className="h-4 w-4" />
              Copy as SVG
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
