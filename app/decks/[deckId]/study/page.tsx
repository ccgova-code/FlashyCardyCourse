import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { DeckSignInPrompt } from "@/components/deck-sign-in-prompt";
import { getCardsByDeckId } from "@/src/db/queries/cards";
import { getDeckById } from "@/src/db/queries/decks";
import { StudySession } from "./study-session";

const deckIdSchema = z.coerce.number().int().positive();

export const metadata: Metadata = {
  title: "Study",
};

export default function StudyPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 bg-background px-4 py-8 text-foreground">
      <Suspense fallback={<StudyFallback />}>
        <StudyContent params={params} />
      </Suspense>
    </main>
  );
}

function StudyFallback() {
  return (
    <>
      <Skeleton className="h-5 w-16" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-72 w-full" />
    </>
  );
}

async function StudyContent({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const { deckId } = await params;
  const parsed = deckIdSchema.safeParse(deckId);
  if (!parsed.success) {
    notFound();
  }

  const deck = await getDeckById(userId, parsed.data);

  if (!deck) {
    return <DeckSignInPrompt redirectUrl={`/decks/${parsed.data}/study`} />;
  }

  const deckCards = await getCardsByDeckId(userId, deck.id);

  return (
    <>
      <Link
        href={`/decks/${deck.id}`}
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-foreground outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Deck
      </Link>
      {deckCards.length === 0 ? (
        <>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">{deck.name}</h1>
            <p className="text-muted-foreground">0 cards</p>
          </div>
          <Empty className="flex-none">
            <EmptyHeader>
              <EmptyTitle>No cards to study</EmptyTitle>
              <EmptyDescription>
                Add a card to this deck before starting a study session.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild variant="outline">
                <Link href={`/decks/${deck.id}`}>Back to deck</Link>
              </Button>
            </EmptyContent>
          </Empty>
        </>
      ) : (
        <StudySession
          deckId={deck.id}
          deckName={deck.name}
          cards={deckCards}
          studiedCount={deck.studiedCount}
        />
      )}
    </>
  );
}
