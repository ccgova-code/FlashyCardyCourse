"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { deleteDeck } from "./actions";

export function DeleteDeckButton({
  deck,
  cardCount,
}: {
  deck: { id: number; name: string };
  cardCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onConfirm(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    setPending(true);
    setFormError(null);

    try {
      const result = await deleteDeck({ deckId: deck.id });

      if (result?.error) {
        setFormError(result.error.formErrors[0] ?? "Could not delete the deck.");
        return;
      }

      confirmCompleted("Deck deleted", deck.name);
      router.replace("/dashboard");
    } catch {
      setFormError("Could not delete the deck.");
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
          <AlertDialogTitle>Delete this deck?</AlertDialogTitle>
          <AlertDialogDescription>
            {deleteDeckDescription(cardCount)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <p className="whitespace-pre-wrap break-words rounded-lg bg-muted/50 p-3 text-left text-foreground">
          {deck.name}
        </p>
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
            {pending ? "Deleting..." : "Delete deck"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function deleteDeckDescription(cardCount: number) {
  if (cardCount === 0) {
    return "This permanently deletes the deck. You cannot undo this.";
  }

  const cards = cardCount === 1 ? "its 1 card" : `its ${cardCount} cards`;
  return `This permanently deletes the deck and ${cards}. You cannot undo this.`;
}
