"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { confirmCompleted } from "@/lib/confirm-action";
import { createCard } from "./actions";

export function AddCardButton({
  deckId,
  label = "Create a new card",
  className,
}: {
  deckId: number;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [frontError, setFrontError] = useState<string | null>(null);
  const [backError, setBackError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function resetForm() {
    setFront("");
    setBack("");
    setFrontError(null);
    setBackError(null);
    setFormError(null);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFrontError(null);
    setBackError(null);
    setFormError(null);

    try {
      const result = await createCard({ deckId, front, back });

      if (result?.error) {
        setFrontError(result.error.fieldErrors.front?.[0] ?? null);
        setBackError(result.error.fieldErrors.back?.[0] ?? null);
        setFormError(result.error.formErrors[0] ?? null);
        return;
      }

      confirmCompleted("Card added", front);
      resetForm();
      setOpen(false);
    } catch {
      setFormError("Could not add the card.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <Plus data-icon="inline-start" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New card</DialogTitle>
          <DialogDescription>
            Write the front and the back of the card.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="card-front">Front</Label>
            <Textarea
              id="card-front"
              value={front}
              onChange={(event) => setFront(event.target.value)}
              placeholder="Hola"
              aria-invalid={frontError ? true : undefined}
            />
            {frontError ? (
              <p className="text-sm text-destructive">{frontError}</p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="card-back">Back</Label>
            <Textarea
              id="card-back"
              value={back}
              onChange={(event) => setBack(event.target.value)}
              placeholder="Hello"
              aria-invalid={backError ? true : undefined}
            />
            {backError ? (
              <p className="text-sm text-destructive">{backError}</p>
            ) : null}
          </div>
          {formError ? (
            <p className="text-sm text-destructive">{formError}</p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Adding..." : "Add card"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
