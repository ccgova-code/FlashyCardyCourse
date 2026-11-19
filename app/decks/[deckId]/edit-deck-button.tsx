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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { confirmCompleted } from "@/lib/confirm-action";
import { editDeck } from "./actions";

export function EditDeckButton({
  deck,
}: {
  deck: { id: number; name: string; description: string | null };
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(deck.name);
  const [description, setDescription] = useState(deck.description ?? "");
  const [nameError, setNameError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function resetForm() {
    setName(deck.name);
    setDescription(deck.description ?? "");
    setNameError(null);
    setDescriptionError(null);
    setFormError(null);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setNameError(null);
    setDescriptionError(null);
    setFormError(null);

    try {
      const result = await editDeck({
        deckId: deck.id,
        name,
        description,
      });

      if (result?.error) {
        setNameError(result.error.fieldErrors.name?.[0] ?? null);
        setDescriptionError(result.error.fieldErrors.description?.[0] ?? null);
        setFormError(result.error.formErrors[0] ?? null);
        return;
      }

      confirmCompleted("Deck saved", name);
      setOpen(false);
    } catch {
      setFormError("Could not save the deck.");
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
          <DialogTitle>Edit deck</DialogTitle>
          <DialogDescription>
            Update the name and description of this deck.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-deck-name">Name</Label>
            <Input
              id="edit-deck-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={nameError ? true : undefined}
              autoComplete="off"
            />
            {nameError ? (
              <p className="text-sm text-destructive">{nameError}</p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-deck-description">Description</Label>
            <Textarea
              id="edit-deck-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            {descriptionError ? (
              <p className="text-sm text-destructive">{descriptionError}</p>
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
