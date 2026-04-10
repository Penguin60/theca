"use client";

import { useState, useTransition } from "react";
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
import { updateVariable, deleteVariable } from "@/server/actions";
import { Copy, Check, Trash2, Pencil, X, Save } from "lucide-react";
import { toast } from "sonner";

interface Variable {
  id: string;
  key: string;
  value: string;
  updatedAt: Date;
}

export function VariableTable({
  variables,
  username,
}: {
  variables: Variable[];
  username: string;
}) {
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
            <TableHead>Key</TableHead>
            <TableHead>Value</TableHead>
            <TableHead className="w-[100px]">URL</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {variables.map((v) => (
            <VariableRow key={v.id} variable={v} username={username} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function VariableRow({
  variable,
  username,
}: {
  variable: Variable;
  username: string;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(variable.value);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const publicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/v/${username}/${variable.key}`;

  function handleCopy() {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success("URL copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateVariable(variable.id, editValue);
      if (result?.error) {
        toast.error("Failed to update variable");
      } else {
        setEditing(false);
        toast.success("Variable updated");
      }
    });
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

  return (
    <TableRow>
      <TableCell className="font-mono text-sm">{variable.key}</TableCell>
      <TableCell>
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="h-8"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") {
                  setEditing(false);
                  setEditValue(variable.value);
                }
              }}
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0"
              onClick={handleSave}
              disabled={isPending}
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0"
              onClick={() => {
                setEditing(false);
                setEditValue(variable.value);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <button
            className="group flex items-center gap-2 text-left"
            onClick={() => setEditing(true)}
          >
            <span className="truncate max-w-[300px]">{variable.value}</span>
            <Pencil className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
      </TableCell>
      <TableCell>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </TableCell>
      <TableCell>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={handleDelete}
          disabled={isPending}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
