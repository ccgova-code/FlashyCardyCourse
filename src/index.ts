import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { cards, decks } from "./db/schema";

const db = drizzle(process.env.DATABASE_URL!);

async function main() {
  const [deck] = await db
    .insert(decks)
    .values({
      userId: "user_example",
      name: "Indonesian",
      description: "English to Indonesian vocabulary",
    })
    .returning();

  await db.insert(cards).values([
    { deckId: deck.id, front: "Dog", back: "Anjing" },
    {
      deckId: deck.id,
      front: "When was the battle of Hastings?",
      back: "1066",
    },
  ]);
  console.log("Deck and cards created!");

  const deckCards = await db
    .select()
    .from(cards)
    .where(eq(cards.deckId, deck.id));
  console.log("Cards in the deck: ", deckCards);

  await db.delete(decks).where(eq(decks.id, deck.id));
  console.log("Deck deleted (cards removed by cascade)!");
}

main();
