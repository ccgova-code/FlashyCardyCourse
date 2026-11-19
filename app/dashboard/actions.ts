"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { countDecksByUserId, insertDeck } from "@/src/db/queries/decks";

const FREE_DECK_LIMIT = 3;

const createDeckSchema = z.object({
  name: z.string().trim().min(1, "Enter a name").max(255),
  description: z
    .string()
    .trim()
    .max(2000)
    .transform((value) => (value.length === 0 ? null : value)),
});

type CreateDeckInput = z.infer<typeof createDeckSchema>;

export async function createDeck(input: CreateDeckInput) {
  const parsed = createDeckSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }

  const { userId, has } = await auth();
  if (!userId) {
    return {
      error: {
        formErrors: ["Sign in to create a deck."],
        fieldErrors: {},
      },
    };
  }

  if (!has({ feature: "unlimited_decks" })) {
    if (!has({ feature: "three_deck_limit" })) {
      return {
        error: {
          formErrors: ["Upgrade to create a deck."],
          fieldErrors: {},
        },
      };
    }

    const deckCount = await countDecksByUserId(userId);
    if (deckCount >= FREE_DECK_LIMIT) {
      return {
        error: {
          formErrors: ["The free plan includes 3 decks. Upgrade to add more."],
          fieldErrors: {},
        },
      };
    }
  }

  const { name, description } = parsed.data;

  try {
    await insertDeck({
      userId,
      name,
      description,
    });
  } catch {
    return {
      error: {
        formErrors: ["Could not create the deck."],
        fieldErrors: {},
      },
    };
  }

  revalidatePath("/dashboard");
}
