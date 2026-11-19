"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { confirmCompleted } from "@/lib/confirm-action";
import { deleteCard } from "./actions";

export function DeleteCardButton({
  deckId,
  card,
}: {
  deckId: number;
  card: { id: number; front: string; back: string };
}) {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onConfirm(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    setPending(true);
    setFormError(null);

    try {
      const result = await deleteCard({ deckId, cardId: card.id });

      if (result?.error) {
        setFormError(result.error.formErrors[0] ?? "Could not delete the card.");
        return;
      }

      confirmCompleted("Card deleted", card.front);
      setOpen(false);
    } catch {
      setFormError("Could not delete the card.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (pending) {
          return;
        }
        setOpen(next);
        if (!next) {
          setFormError(null);
        }
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 data-icon="inline-start" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this card?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the card from the deck. You cannot undo this.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid max-h-48 gap-3 overflow-y-auto rounded-lg bg-muted/50 p-3 text-left">
          <div className="grid gap-1">
            <p className="text-sm text-muted-foreground">Front</p>
            <p className="whitespace-pre-wrap break-words text-foreground">
              {card.front}
            </p>
          </div>
          <div className="grid gap-1">
            <p className="text-sm text-muted-foreground">Back</p>
            <p className="whitespace-pre-wrap break-words text-foreground">
              {card.back}
            </p>
          </div>
        </div>
        {formError ? (
          <p className="text-sm text-destructive">{formError}</p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? "Deleting..." : "Delete card"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
