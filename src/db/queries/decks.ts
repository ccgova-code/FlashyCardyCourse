import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/src/db";
import { cards, decks } from "@/src/db/schema";

export async function countDecksByUserId(userId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(decks)
    .where(eq(decks.userId, userId));

  return Number(row?.value ?? 0);
}

export async function getDecksByUserId(userId: string) {
  return db
    .select({
      id: decks.id,
      name: decks.name,
      description: decks.description,
      updatedAt: decks.updatedAt,
      cardCount: count(cards.id),
    })
    .from(decks)
    .leftJoin(cards, eq(cards.deckId, decks.id))
    .where(eq(decks.userId, userId))
    .groupBy(decks.id, decks.name, decks.description, decks.updatedAt)
    .orderBy(desc(decks.updatedAt));
}

export async function getDeckById(userId: string, deckId: number) {
  const [deck] = await db
    .select({
      id: decks.id,
      name: decks.name,
      description: decks.description,
      studiedCount: decks.studiedCount,
      updatedAt: decks.updatedAt,
    })
    .from(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)))
    .limit(1);

  return deck;
}

export async function insertDeck(values: {
  userId: string;
  name: string;
  description: string | null;
}) {
  return db.insert(decks).values(values).returning();
}

export async function updateDeck(values: {
  userId: string;
  deckId: number;
  name: string;
  description: string | null;
}) {
  return db
    .update(decks)
    .set({
      name: values.name,
      description: values.description,
    })
    .where(and(eq(decks.id, values.deckId), eq(decks.userId, values.userId)))
    .returning();
}

export async function deleteDeck(values: { userId: string; deckId: number }) {
  return db
    .delete(decks)
    .where(and(eq(decks.id, values.deckId), eq(decks.userId, values.userId)))
    .returning();
}

export async function setDeckStudiedCount(values: {
  userId: string;
  deckId: number;
  studiedCount: number;
}) {
  const [existing] = await db
    .select({ updatedAt: decks.updatedAt })
    .from(decks)
    .where(and(eq(decks.id, values.deckId), eq(decks.userId, values.userId)))
    .limit(1);

  if (!existing) {
    return [];
  }

  return db
    .update(decks)
    .set({
      studiedCount: values.studiedCount,
      updatedAt: existing.updatedAt,
    })
    .where(and(eq(decks.id, values.deckId), eq(decks.userId, values.userId)))
    .returning();
}
