"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { confirmCompleted } from "@/lib/confirm-action";
import { recordStudyProgress } from "../actions";

type StudyCard = {
  id: number;
  front: string;
  back: string;
};

type Grade = "correct" | "incorrect";

function shuffleCards(source: StudyCard[], attempt = 0): StudyCard[] {
  const next = [...source];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const current = next[i];
    next[i] = next[j];
    next[j] = current;
  }

  const sameOrder = next.every((card, i) => card.id === source[i]?.id);
  if (sameOrder && next.length > 1 && attempt < 5) {
    return shuffleCards(source, attempt + 1);
  }

  return next;
}

export function StudySession({
  deckId,
  deckName,
  cards,
  studiedCount,
}: {
  deckId: number;
  deckName: string;
  cards: StudyCard[];
  studiedCount: number;
}) {
  const alreadyFinished = cards.length > 0 && studiedCount >= cards.length;
  const [deckCards, setDeckCards] = useState(cards);
  const [index, setIndex] = useState(alreadyFinished ? 0 : studiedCount);
  const [furthest, setFurthest] = useState(
    alreadyFinished ? cards.length : studiedCount,
  );
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(alreadyFinished);
  const [results, setResults] = useState<Record<number, Grade>>({});

  const saveProgress = useCallback(
    (count: number, title: string) => {
      void recordStudyProgress({ deckId, studiedCount: count }).then((result) => {
        if (!result?.error) {
          confirmCompleted(title);
        }
      });
    },
    [deckId],
  );

  const goToPrevious = useCallback(() => {
    if (index === 0) {
      return;
    }
    setIndex(index - 1);
    setRevealed(false);
  }, [index]);

  const goToNext = useCallback(() => {
    if (index >= deckCards.length - 1) {
      return;
    }

    const nextIndex = index + 1;
    setIndex(nextIndex);
    setRevealed(false);
    if (nextIndex > furthest) {
      setFurthest(nextIndex);
      saveProgress(nextIndex, "Card completed");
    }
  }, [deckCards.length, furthest, index, saveProgress]);

  const finish = useCallback(() => {
    setFinished(true);
    if (furthest < deckCards.length) {
      setFurthest(deckCards.length);
      saveProgress(deckCards.length, "Study session finished");
    }
  }, [deckCards.length, furthest, saveProgress]);

  const studyAgain = useCallback(() => {
    setFinished(false);
    setIndex(0);
    setRevealed(false);
    setFurthest(0);
    setResults({});
    saveProgress(0, "Study session started");
  }, [saveProgress]);

  const shuffleDeck = useCallback(() => {
    if (deckCards.length < 2) {
      return;
    }

    setDeckCards((current) => shuffleCards(current));
    setFinished(false);
    setIndex(0);
    setRevealed(false);
    setFurthest(0);
    setResults({});
    confirmCompleted("Deck shuffled");
    void recordStudyProgress({ deckId, studiedCount: 0 });
  }, [deckCards.length, deckId]);

  const gradeCard = useCallback(
    (result: Grade) => {
      const current = deckCards[index];
      if (!current) {
        return;
      }

      setResults((previous) => ({ ...previous, [current.id]: result }));
      if (index >= deckCards.length - 1) {
        finish();
        return;
      }
      goToNext();
    },
    [deckCards, finish, goToNext, index],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat || finished) {
        return;
      }

      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPrevious();
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (index >= deckCards.length - 1) {
          finish();
        } else {
          goToNext();
        }
        return;
      }

      if (event.key === " " || event.code === "Space") {
        event.preventDefault();
        setRevealed((open) => !open);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deckCards.length, finish, finished, goToNext, goToPrevious, index]);

  const card = deckCards[index];
  const progressValue =
    deckCards.length === 0 ? 0 : (furthest / deckCards.length) * 100;

  const cardCountLabel =
    deckCards.length === 1 ? "1 card" : `${deckCards.length} cards`;
  const correctCount = Object.values(results).filter(
    (result) => result === "correct",
  ).length;
  const incorrectCount = Object.values(results).filter(
    (result) => result === "incorrect",
  ).length;
  const gradedCount = correctCount + incorrectCount;
  const accuracy =
    gradedCount === 0 ? 0 : Math.round((correctCount / gradedCount) * 100);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight break-words">
            {deckName}
          </h1>
          <p className="text-muted-foreground">{cardCountLabel}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Button
            variant="outline"
            onClick={shuffleDeck}
            disabled={deckCards.length < 2}
          >
            <Shuffle />
            Shuffle
          </Button>
          <p className="text-right text-sm text-muted-foreground" aria-live="polite">
            {correctCount} correct
            <br />
            {incorrectCount} incorrect
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            {finished
              ? `${deckCards.length} of ${deckCards.length} complete`
              : `Card ${index + 1} of ${deckCards.length}`}
          </p>
          <Progress value={progressValue} aria-label="Study progress" />
        </div>

        {finished || !card ? (
          <Card>
            <CardHeader>
              <CardTitle>Finished</CardTitle>
              <CardDescription>You reached the end of {deckName}.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 text-center">
                <div className="flex flex-col gap-1">
                  <p className="text-3xl font-semibold text-success">{correctCount}</p>
                  <p className="text-sm text-foreground">correct</p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-3xl font-semibold text-destructive">{incorrectCount}</p>
                  <p className="text-sm text-foreground">incorrect</p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-3xl font-semibold text-foreground">{accuracy}%</p>
                  <p className="text-sm text-foreground">accuracy</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-wrap gap-2">
              <Button onClick={studyAgain}>Study again</Button>
              <Button asChild variant="outline">
                <Link href={`/decks/${deckId}`}>Back to deck</Link>
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardDescription>{revealed ? "Back" : "Front"}</CardDescription>
              </CardHeader>
              <CardContent>
                <p
                  className="min-h-36 whitespace-pre-wrap break-words text-xl text-foreground"
                  aria-live="polite"
                >
                  {revealed ? card.back : card.front}
                </p>
              </CardContent>
              <CardFooter className="flex-wrap justify-between gap-2">
                <Button
                  variant="outline"
                  onClick={goToPrevious}
                  disabled={index === 0}
                >
                  Previous
                </Button>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setRevealed((open) => !open)}
                  >
                    {revealed ? "Hide answer" : "Show answer"}
                  </Button>
                  {index === deckCards.length - 1 ? (
                    <Button onClick={finish}>Finish</Button>
                  ) : (
                    <Button onClick={goToNext}>Next card</Button>
                  )}
                </div>
              </CardFooter>
            </Card>
            {revealed ? (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  className="bg-destructive text-background hover:bg-destructive/90"
                  onClick={() => gradeCard("incorrect")}
                >
                  Incorrect
                </Button>
                <Button
                  className="bg-success text-success-foreground hover:bg-success/90"
                  onClick={() => gradeCard("correct")}
                >
                  Correct
                </Button>
              </div>
            ) : null}
            <p className="text-sm text-muted-foreground">
              Space flips the card. Arrow keys move between cards.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
