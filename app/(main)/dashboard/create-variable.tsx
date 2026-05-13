"use client";

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
import { createVariable } from "@/server/actions";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface FolderItem {
  id: string;
  name: string;
}

export function CreateVariable({
  folders,
  defaultFolderId,
}: {
  folders: FolderItem[];
  defaultFolderId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [valueType, setValueType] = useState<"text" | "array">("text");
  const [items, setItems] = useState<string[]>([""]);

  function addItem() {
    setItems((prev) => [...prev, ""]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index: number, val: string) {
    setItems((prev) => prev.map((item, i) => (i === index ? val : item)));
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setErrors({});
      setValueType("text");
      setItems([""]);
    }
  }

  function handleSubmit(formData: FormData) {
    setErrors({});
    if (valueType === "array") {
      formData.set("value", JSON.stringify(items));
      formData.set("valueType", "array");
    } else {
      formData.set("valueType", "text");
    }
    startTransition(async () => {
      const result = await createVariable(formData);
      if (result?.error) {
        setErrors(result.error as Record<string, string[]>);
      } else {
        handleOpenChange(false);
        toast.success("Variable created");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            size="icon"
            aria-label="New variable"
            className="size-10 shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Variable</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="key">Key</Label>
            <Input
              id="key"
              name="key"
              placeholder="my-variable"
              pattern="[a-z0-9-]+"
              maxLength={64}
              required
            />
            {errors.key && (
              <p className="text-sm text-destructive">{errors.key[0]}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Lowercase letters, numbers, and hyphens only
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Value</Label>
              <div className="flex rounded-md border text-xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => setValueType("text")}
                  className={`px-2.5 py-1 cursor-pointer transition-colors ${
                    valueType === "text"
                      ? "bg-foreground text-background"
                      : "hover:bg-muted"
                  }`}
                >
                  Text
                </button>
                <button
                  type="button"
                  onClick={() => setValueType("array")}
                  className={`px-2.5 py-1 cursor-pointer transition-colors border-l ${
                    valueType === "array"
                      ? "bg-foreground text-background"
                      : "hover:bg-muted"
                  }`}
                >
                  Array
                </button>
              </div>
            </div>
            {valueType === "text" ? (
              <Input id="value" name="value" placeholder="Hello, world!" />
            ) : (
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={item}
                      onChange={(e) => updateItem(index, e.target.value)}
                      placeholder={`Item ${index + 1}`}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="shrink-0 cursor-pointer"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full cursor-pointer"
                  onClick={addItem}
                  disabled={items.length >= 50}
                >
                  <Plus className="h-4 w-4" />
                  Add item
                </Button>
              </div>
            )}
            {errors.value && (
              <p className="text-sm text-destructive">{errors.value[0]}</p>
            )}
          </div>
          {folders.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="folderId">Folder</Label>
              <select
                id="folderId"
                name="folderId"
                defaultValue={defaultFolderId ?? ""}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Uncategorized</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              {errors.folderId && (
                <p className="text-sm text-destructive">{errors.folderId[0]}</p>
              )}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating..." : "Create"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
