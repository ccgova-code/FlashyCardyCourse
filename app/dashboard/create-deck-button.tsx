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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { confirmCompleted } from "@/lib/confirm-action";
import { createDeck } from "./actions";

export function CreateDeckButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function resetForm() {
    setName("");
    setDescription("");
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
      const result = await createDeck({
        name,
        description,
      });

      if (result?.error) {
        setNameError(result.error.fieldErrors.name?.[0] ?? null);
        setDescriptionError(result.error.fieldErrors.description?.[0] ?? null);
        setFormError(result.error.formErrors[0] ?? null);
        return;
      }

      confirmCompleted("Deck created", name);
      resetForm();
      setOpen(false);
    } catch {
      setFormError("Could not create the deck.");
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
        <Button className="w-full">
          <Plus data-icon="inline-start" />
          Create new deck
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New deck</DialogTitle>
          <DialogDescription>
            Name the deck and add a short description if you want one.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="deck-name">Name</Label>
            <Input
              id="deck-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Spanish verbs"
              aria-invalid={nameError ? true : undefined}
              autoComplete="off"
            />
            {nameError ? (
              <p className="text-sm text-destructive">{nameError}</p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="deck-description">Description</Label>
            <Textarea
              id="deck-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Present-tense verbs to review this week"
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
              {pending ? "Creating..." : "Create deck"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
