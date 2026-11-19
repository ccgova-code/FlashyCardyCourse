import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Show } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { AddCardButton } from "./add-card-button";
import { DeleteCardButton } from "./delete-card-button";
import { DeleteDeckButton } from "./delete-deck-button";
import { EditCardButton } from "./edit-card-button";
import { EditDeckButton } from "./edit-deck-button";
import {
  GenerateCardsButton,
  GenerateCardsRequirementPrompt,
  GenerateCardsUpgradeButton,
} from "./generate-cards-button";
import { StartStudyButton } from "./start-study-button";

const deckIdSchema = z.coerce.number().int().positive();

export const metadata: Metadata = {
  title: "Deck",
};

export const maxDuration = 60;

export default function DeckPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 bg-background px-4 py-8 text-foreground">
      <Suspense fallback={<DeckFallback />}>
        <DeckContent params={params} />
      </Suspense>
    </main>
  );
}

function DeckFallback() {
  return (
    <>
      <Skeleton className="h-5 w-28" />
      <Skeleton className="h-56 w-full" />
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {["first", "second", "third"].map((slot) => (
          <li key={slot}>
            <Skeleton className="h-40 w-full" />
          </li>
        ))}
      </ul>
    </>
  );
}

async function DeckContent({
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
    return <DeckSignInPrompt redirectUrl={`/decks/${parsed.data}`} />;
  }

  const deckCards = await getCardsByDeckId(userId, deck.id);
  const completed = Math.min(deck.studiedCount, deckCards.length);

  return (
    <>
      <Link
        href="/dashboard"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-foreground outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Dashboard
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="text-3xl font-semibold tracking-tight">{deck.name}</h1>
          </CardTitle>
          <CardAction className="flex flex-wrap justify-end gap-2">
            <EditDeckButton deck={deck} />
            <DeleteDeckButton
              deck={{ id: deck.id, name: deck.name }}
              cardCount={deckCards.length}
            />
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {deck.description ? (
            <p className="whitespace-pre-wrap text-muted-foreground">
              {deck.description}
            </p>
          ) : null}
          <div className="flex flex-col gap-1">
            <p className="text-muted-foreground">
              {formatCardCount(deckCards.length)}
            </p>
            <p className="text-muted-foreground">
              Last updated{" "}
              <time dateTime={deck.updatedAt.toISOString()}>
                {formatUpdatedOn(deck.updatedAt)}
              </time>
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex-wrap gap-2">
          <StartStudyButton
            deckId={deck.id}
            cardCount={deckCards.length}
            studiedCount={completed}
          />
          <div className="ml-auto">
            <AddCardButton deckId={deck.id} />
          </div>
        </CardFooter>
      </Card>
      {deckCards.length > 0 ? (
        <Suspense fallback={<Skeleton className="h-8 w-48" />}>
          <GenerateCardsControl
            deckId={deck.id}
            name={deck.name}
            description={deck.description}
          />
        </Suspense>
      ) : null}

      {deckCards.length === 0 ? (
        <Empty className="flex-none">
          <EmptyHeader>
            <EmptyTitle>No cards yet</EmptyTitle>
            <EmptyDescription>
              Add a card to start studying this deck.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className="flex w-full flex-col gap-2">
              <AddCardButton
                deckId={deck.id}
                label="Add your first card"
                className="w-full"
              />
              <div className="w-full">
                <Suspense fallback={<Skeleton className="h-8 w-full" />}>
                  <GenerateCardsControl
                    deckId={deck.id}
                    name={deck.name}
                    description={deck.description}
                    className="w-full"
                  />
                </Suspense>
              </div>
            </div>
          </EmptyContent>
        </Empty>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deckCards.map((card) => (
            <li key={card.id} className="min-w-0">
              <Card size="sm" className="h-full">
                <CardHeader>
                  <p className="text-sm text-muted-foreground">Front</p>
                  <CardTitle className="whitespace-pre-wrap break-words">
                    {card.front}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-1">
                  <p className="text-sm text-muted-foreground">Back</p>
                  <p className="whitespace-pre-wrap break-words text-foreground">
                    {card.back}
                  </p>
                </CardContent>
                <CardFooter className="flex-wrap justify-end gap-2">
                  <EditCardButton deckId={deck.id} card={card} />
                  <DeleteCardButton deckId={deck.id} card={card} />
                </CardFooter>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function GenerateCardsControl({
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
  if (!description?.trim()) {
    return (
      <GenerateCardsRequirementPrompt
        message="Add a description first."
        className={className}
      />
    );
  }

  if (!name.trim()) {
    return (
      <GenerateCardsRequirementPrompt
        message="Add a title first."
        className={className}
      />
    );
  }

  return (
    <Show
      when={{ feature: "ai_flashcard_generation" }}
      fallback={
        <Show
          when={{ plan: "pro" }}
          fallback={<GenerateCardsUpgradeButton className={className} />}
        >
          <GenerateCardsButton
            deckId={deckId}
            name={name}
            description={description}
            className={className}
          />
        </Show>
      }
    >
      <GenerateCardsButton
        deckId={deckId}
        name={name}
        description={description}
        className={className}
      />
    </Show>
  );
}

function formatCardCount(cardCount: number) {
  return cardCount === 1 ? "1 card" : `${cardCount} cards`;
}

function formatUpdatedOn(updatedAt: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(updatedAt);
}
