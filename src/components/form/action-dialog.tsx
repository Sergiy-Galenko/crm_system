"use client";

import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { idleActionState, type ActionResult } from "@/lib/actions";

export function ActionDialog({
  trigger,
  title,
  description,
  children,
  state,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  children: (close: () => void) => React.ReactNode;
  state?: ActionResult;
}) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const currentState = state ?? idleActionState;

    if (!currentState.message) {
      return;
    }

    if (currentState.success) {
      toast.success(currentState.message);
      setOpen(false);
      return;
    }

    toast.error(currentState.message);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children(() => setOpen(false))}
      </DialogContent>
    </Dialog>
  );
}
