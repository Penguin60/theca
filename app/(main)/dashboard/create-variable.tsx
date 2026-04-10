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
import { Plus } from "lucide-react";
import { toast } from "sonner";

export function CreateVariable() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  function handleSubmit(formData: FormData) {
    setErrors({});
    startTransition(async () => {
      const result = await createVariable(formData);
      if (result?.error) {
        setErrors(result.error as Record<string, string[]>);
      } else {
        setOpen(false);
        toast.success("Variable created");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Variable
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
            <Label htmlFor="value">Value</Label>
            <Input id="value" name="value" placeholder="Hello, world!" />
            {errors.value && (
              <p className="text-sm text-destructive">{errors.value[0]}</p>
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
