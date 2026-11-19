import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Show } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Layers } from "lucide-react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { getDecksByUserId } from "@/src/db/queries/decks";
import { CreateDeckButton } from "./create-deck-button";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 bg-background px-4 py-8 text-foreground">
      <Suspense fallback={<DashboardFallback />}>
        <DashboardContent />
      </Suspense>
    </main>
  );
}

function DashboardFallback() {
  return (
    <>
      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Manage your flashcard decks and study progress</p>
        </div>
        <Skeleton className="h-10 w-28 shrink-0" />
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {["first", "second", "third"].map((slot) => (
          <li key={slot}>
            <Card className="h-full">
              <CardHeader>
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="col-span-full h-4 w-full" />
              </CardHeader>
              <CardContent className="mt-auto">
                <Skeleton className="h-4 w-40" />
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}

async function DashboardContent() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const userDecks = await getDecksByUserId(userId);

  return (
    <>
      <div className="flex items-start justify-between gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Manage your flashcard decks and study progress</p>
          </div>

          <Suspense fallback={<FreePlanFallback />}>
            <FreePlanUpgrade deckCount={userDecks.length} />
          </Suspense>
        </div>

        <Suspense fallback={<ProPlanFallback />}>
          <ProPlanNote deckCount={userDecks.length} />
        </Suspense>
      </div>

      {userDecks.length === 0 ? (
        <Empty className="flex-none">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Layers />
            </EmptyMedia>
            <EmptyTitle>No decks yet</EmptyTitle>
            <EmptyDescription>
              Create a deck to start adding flashcards.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className={deckGridClassName}>
          {userDecks.map((deck) => {
            return (
              <li key={deck.id} className="h-full">
                <Link
                  href={`/decks/${deck.id}`}
                  className="block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <Card className="h-full transition-colors hover:bg-muted/50">
                    <CardHeader>
                      <CardTitle>{deck.name}</CardTitle>
                      {deck.description ? (
                        <CardDescription className="col-span-full">
                          {deck.description}
                        </CardDescription>
                      ) : null}
                    </CardHeader>
                    <CardContent className="mt-auto flex flex-col gap-1">
                      <CardDescription>{formatCardCount(deck.cardCount)}</CardDescription>
                      <CardDescription>
                        Last updated{" "}
                        <time dateTime={deck.updatedAt.toISOString()}>
                          {formatUpdatedOn(deck.updatedAt)}
                        </time>
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Suspense fallback={<CreateDeckFallback />}>
        <DeckCreateControl deckCount={userDecks.length} />
      </Suspense>
    </>
  );
}

function CreateDeckFallback() {
  return (
    <div className={deckGridClassName}>
      <Skeleton className="h-8 w-full" />
    </div>
  );
}

const FREE_DECK_LIMIT = 3;

function FreePlanFallback() {
  return <Skeleton className="h-16 w-full max-w-sm" />;
}

function ProPlanFallback() {
  return <Skeleton className="h-10 w-28 shrink-0" />;
}

function ProPlanNote({ deckCount }: { deckCount: number }) {
  return (
    <Show when={{ plan: "pro" }} fallback={null}>
      <p className="shrink-0 text-right text-sm text-muted-foreground">
        <span className="block text-foreground">You&apos;re on the Pro plan</span>
        {formatDeckTotal(deckCount)}
      </p>
    </Show>
  );
}

function formatDeckTotal(deckCount: number) {
  return deckCount === 1 ? "1 deck" : `${deckCount} decks`;
}

function FreePlanUpgrade({ deckCount }: { deckCount: number }) {
  return (
    <Show when={{ feature: "unlimited_decks" }} fallback={<FreePlanOffer deckCount={deckCount} />}>
      {null}
    </Show>
  );
}

function FreePlanOffer({ deckCount }: { deckCount: number }) {
  return (
    <Show when={{ feature: "three_deck_limit" }} fallback={null}>
      <div className="flex flex-col items-start gap-2">
        <p className="text-sm text-muted-foreground">
          {deckCount} of {FREE_DECK_LIMIT} decks
        </p>
        <Button asChild>
          <Link href="/pricing">Upgrade to Pro</Link>
        </Button>
        <p className="max-w-sm text-sm text-muted-foreground">
          Pro includes unlimited decks and AI flashcard generation.
        </p>
      </div>
    </Show>
  );
}

function DeckCreateControl({ deckCount }: { deckCount: number }) {
  return (
    <Show
      when={{ feature: "unlimited_decks" }}
      fallback={<LimitedDeckCreate deckCount={deckCount} />}
    >
      <div className={deckGridClassName}>
        <CreateDeckButton />
      </div>
    </Show>
  );
}

function LimitedDeckCreate({ deckCount }: { deckCount: number }) {
  const atLimit = deckCount >= FREE_DECK_LIMIT;

  return (
    <Show
      when={{ feature: "three_deck_limit" }}
      fallback={<UpgradeNotice message="Upgrade to create decks." />}
    >
      {atLimit ? null : (
        <div className={deckGridClassName}>
          <CreateDeckButton />
        </div>
      )}
    </Show>
  );
}

function UpgradeNotice({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" asChild>
        <Link href="/pricing">Upgrade to Pro</Link>
      </Button>
      <p className="max-w-sm text-sm text-muted-foreground">
        Pro includes unlimited decks and AI flashcard generation.
      </p>
    </div>
  );
}

const deckGridClassName = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";

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
