"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { confirmCompleted } from "@/lib/confirm-action";
import { recordStudyProgress } from "./actions";

export function StartStudyButton({
  deckId,
  cardCount,
  studiedCount,
}: {
  deckId: number;
  cardCount: number;
  studiedCount: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const restart = cardCount > 0 && studiedCount >= cardCount;

  async function onRestart() {
    setPending(true);
    try {
      const result = await recordStudyProgress({ deckId, studiedCount: 0 });
      if (!result?.error) {
        confirmCompleted("Study session started");
      }
      router.push(`/decks/${deckId}/study`);
    } finally {
      setPending(false);
    }
  }

  if (restart) {
    return (
      <Button onClick={onRestart} disabled={pending}>
        {pending ? "Starting..." : "Start a study session"}
      </Button>
    );
  }

  return (
    <Button asChild>
      <Link
        href={`/decks/${deckId}/study`}
        onClick={() => confirmCompleted("Study session started")}
      >
        Start a study session
      </Link>
    </Button>
  );
}
