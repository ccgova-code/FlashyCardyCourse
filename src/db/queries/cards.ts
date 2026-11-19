import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/src/db";
import { cards, decks } from "@/src/db/schema";

export async function getCardsByDeckId(userId: string, deckId: number) {
  return db
    .select({
      id: cards.id,
      front: cards.front,
      back: cards.back,
    })
    .from(cards)
    .innerJoin(decks, eq(cards.deckId, decks.id))
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)))
    .orderBy(desc(cards.updatedAt), desc(cards.id));
}

export async function insertCard(values: {
  userId: string;
  deckId: number;
  front: string;
  back: string;
}) {
  const [deck] = await db
    .select({ id: decks.id })
    .from(decks)
    .where(and(eq(decks.id, values.deckId), eq(decks.userId, values.userId)))
    .limit(1);

  if (!deck) {
    return [];
  }

  return db
    .insert(cards)
    .values({
      deckId: deck.id,
      front: values.front,
      back: values.back,
    })
    .returning();
}

export async function insertCards(values: {
  userId: string;
  deckId: number;
  cards: { front: string; back: string }[];
}) {
  const [deck] = await db
    .select({ id: decks.id })
    .from(decks)
    .where(and(eq(decks.id, values.deckId), eq(decks.userId, values.userId)))
    .limit(1);

  if (!deck) {
    return [];
  }

  if (values.cards.length === 0) {
    return [];
  }

  return db
    .insert(cards)
    .values(
      values.cards.map((card) => ({
        deckId: deck.id,
        front: card.front,
        back: card.back,
      })),
    )
    .returning();
}

export async function updateCard(values: {
  userId: string;
  deckId: number;
  cardId: number;
  front: string;
  back: string;
}) {
  return db
    .update(cards)
    .set({
      front: values.front,
      back: values.back,
    })
    .where(
      and(
        eq(cards.id, values.cardId),
        eq(cards.deckId, values.deckId),
        inArray(cards.deckId, ownedDeckIds(values.userId, values.deckId)),
      ),
    )
    .returning();
}

export async function deleteCard(values: {
  userId: string;
  deckId: number;
  cardId: number;
}) {
  return db
    .delete(cards)
    .where(
      and(
        eq(cards.id, values.cardId),
        eq(cards.deckId, values.deckId),
        inArray(cards.deckId, ownedDeckIds(values.userId, values.deckId)),
      ),
    )
    .returning();
}

function ownedDeckIds(userId: string, deckId: number) {
  return db
    .select({ id: decks.id })
    .from(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)));
}
