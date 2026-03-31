"use client";

import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { idleActionState, type ActionResult } from "@/lib/actions";

export function ActionDialog<T = undefined>({
  trigger,
  title,
  description,
  children,
  state,
  contentClassName,
  onSuccess,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  children: (close: () => void) => React.ReactNode;
  state?: ActionResult<T>;
  contentClassName?: string;
  onSuccess?: (state: ActionResult<T>) => void;
}) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const currentState = (state ?? idleActionState) as ActionResult<T>;

    if (!currentState.message) {
      return;
    }

    if (currentState.success) {
      toast.success(currentState.message);
      onSuccess?.(currentState);
      setOpen(false);
      return;
    }

    toast.error(currentState.message);
  }, [onSuccess, state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className={contentClassName}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children(() => setOpen(false))}
      </DialogContent>
    </Dialog>
  );
}
