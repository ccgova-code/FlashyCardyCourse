"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
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
import { editCard } from "./actions";

export function EditCardButton({
  deckId,
  card,
}: {
  deckId: number;
  card: { id: number; front: string; back: string };
}) {
  const [open, setOpen] = useState(false);
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);
  const [frontError, setFrontError] = useState<string | null>(null);
  const [backError, setBackError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function resetForm() {
    setFront(card.front);
    setBack(card.back);
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
      const result = await editCard({
        deckId,
        cardId: card.id,
        front,
        back,
      });

      if (result?.error) {
        setFrontError(result.error.fieldErrors.front?.[0] ?? null);
        setBackError(result.error.fieldErrors.back?.[0] ?? null);
        setFormError(result.error.formErrors[0] ?? null);
        return;
      }

      confirmCompleted("Card saved", front);
      setOpen(false);
    } catch {
      setFormError("Could not save the card.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil data-icon="inline-start" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit card</DialogTitle>
          <DialogDescription>
            Update the front and the back of the card.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor={`card-front-${card.id}`}>Front</Label>
            <Textarea
              id={`card-front-${card.id}`}
              value={front}
              onChange={(event) => setFront(event.target.value)}
              aria-invalid={frontError ? true : undefined}
            />
            {frontError ? (
              <p className="text-sm text-destructive">{frontError}</p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`card-back-${card.id}`}>Back</Label>
            <Textarea
              id={`card-back-${card.id}`}
              value={back}
              onChange={(event) => setBack(event.target.value)}
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
              {pending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
