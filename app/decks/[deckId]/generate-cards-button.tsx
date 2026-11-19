"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { confirmCompleted } from "@/lib/confirm-action";
import { generateCards } from "./actions";

const GENERATED_CARD_COUNT = 20;

function deckTopic(name: string, description: string | null) {
  const details = description?.trim();
  if (details) {
    return `${name}. ${details}`;
  }
  return name;
}

export function GenerateCardsButton({
  deckId,
  name,
  description,
  className,
}: {
  deckId: number;
  name: string;
  description: string | null;
  className?: string;
}) {
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onGenerate() {
    setPending(true);
    setFormError(null);

    try {
      const result = await generateCards({
        deckId,
        topic: deckTopic(name, description),
        count: GENERATED_CARD_COUNT,
      });

      if (result?.error) {
        setFormError(
          result.error.formErrors[0] ??
            result.error.fieldErrors.topic?.[0] ??
            result.error.fieldErrors.count?.[0] ??
            "Could not generate cards.",
        );
        return;
      }

      confirmCompleted("Cards generated", "20 cards added");
    } catch {
      setFormError("Could not generate cards.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={cn("flex flex-col items-start gap-1", className)}>
      <Button
        type="button"
        variant="outline"
        className={className ? "w-full" : undefined}
        onClick={onGenerate}
        disabled={pending}
      >
        <Sparkles data-icon="inline-start" />
        {pending ? "Generating..." : "Generate cards with AI"}
      </Button>
      {formError ? (
        <p className="max-w-xs text-sm text-destructive">{formError}</p>
      ) : null}
    </div>
  );
}

export function GenerateCardsRequirementPrompt({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Tooltip open={open}>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className={cn(
            "inline-flex w-full cursor-not-allowed rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            className,
          )}
          onPointerEnter={() => setOpen(true)}
          onPointerLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
        >
          <Button
            type="button"
            variant="outline"
            aria-disabled="true"
            tabIndex={-1}
            className="pointer-events-none w-full opacity-50"
          >
            <Sparkles data-icon="inline-start" />
            Generate cards with AI
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent sideOffset={6}>{message}</TooltipContent>
    </Tooltip>
  );
}

export function GenerateCardsUpgradeButton({
  className,
}: {
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" className={className} asChild>
          <Link href="/pricing">
            <Sparkles data-icon="inline-start" />
            Generate cards with AI
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent sideOffset={6}>This is a paid feature.</TooltipContent>
    </Tooltip>
  );
}
