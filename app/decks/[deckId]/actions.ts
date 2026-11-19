"use server";

import { auth } from "@clerk/nextjs/server";
import { generateText, Output } from "ai";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  deleteCard as deleteCardRow,
  getCardsByDeckId,
  insertCard,
  insertCards,
  updateCard,
} from "@/src/db/queries/cards";
import {
  deleteDeck as deleteDeckRow,
  getDeckById,
  setDeckStudiedCount,
  updateDeck,
} from "@/src/db/queries/decks";

const cardTextSchema = z.object({
  front: z
    .string()
    .trim()
    .min(1, "Enter the front of the card")
    .max(5000, "Front must be 5000 characters or fewer"),
  back: z
    .string()
    .trim()
    .min(1, "Enter the back of the card")
    .max(5000, "Back must be 5000 characters or fewer"),
});

const createCardSchema = cardTextSchema.extend({
  deckId: z.number().int().positive(),
});

const updateCardSchema = cardTextSchema.extend({
  deckId: z.number().int().positive(),
  cardId: z.number().int().positive(),
});

type CreateCardInput = z.infer<typeof createCardSchema>;

export async function createCard(input: CreateCardInput) {
  const parsed = createCardSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }

  const { userId } = await auth();
  if (!userId) {
    return {
      error: {
        formErrors: ["Sign in to add a card."],
        fieldErrors: {},
      },
    };
  }

  const { deckId, front, back } = parsed.data;

  try {
    const inserted = await insertCard({ userId, deckId, front, back });
    if (inserted.length === 0) {
      return {
        error: {
          formErrors: ["That deck was not found."],
          fieldErrors: {},
        },
      };
    }
  } catch {
    return {
      error: {
        formErrors: ["Could not add the card."],
        fieldErrors: {},
      },
    };
  }

  revalidatePath(`/decks/${deckId}`);
  revalidatePath(`/decks/${deckId}/study`);
}

type UpdateCardInput = z.infer<typeof updateCardSchema>;

export async function editCard(input: UpdateCardInput) {
  const parsed = updateCardSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }

  const { userId } = await auth();
  if (!userId) {
    return {
      error: {
        formErrors: ["Sign in to edit a card."],
        fieldErrors: {},
      },
    };
  }

  const { deckId, cardId, front, back } = parsed.data;

  try {
    const updated = await updateCard({ userId, deckId, cardId, front, back });
    if (updated.length === 0) {
      return {
        error: {
          formErrors: ["That card was not found."],
          fieldErrors: {},
        },
      };
    }
  } catch {
    return {
      error: {
        formErrors: ["Could not save the card."],
        fieldErrors: {},
      },
    };
  }

  revalidatePath(`/decks/${deckId}`);
  revalidatePath(`/decks/${deckId}/study`);
}

const deleteCardSchema = z.object({
  deckId: z.number().int().positive(),
  cardId: z.number().int().positive(),
});

type DeleteCardInput = z.infer<typeof deleteCardSchema>;

export async function deleteCard(input: DeleteCardInput) {
  const parsed = deleteCardSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }

  const { userId } = await auth();
  if (!userId) {
    return {
      error: {
        formErrors: ["Sign in to delete a card."],
        fieldErrors: {},
      },
    };
  }

  const { deckId, cardId } = parsed.data;

  try {
    const deleted = await deleteCardRow({ userId, deckId, cardId });
    if (deleted.length === 0) {
      return {
        error: {
          formErrors: ["That card was not found."],
          fieldErrors: {},
        },
      };
    }
  } catch {
    return {
      error: {
        formErrors: ["Could not delete the card."],
        fieldErrors: {},
      },
    };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/decks/${deckId}`);
  revalidatePath(`/decks/${deckId}/study`);
}

const editDeckSchema = z.object({
  deckId: z.number().int().positive(),
  name: z.string().trim().min(1, "Enter a name").max(255),
  description: z
    .string()
    .trim()
    .max(2000)
    .transform((value) => (value.length === 0 ? null : value)),
});

type EditDeckInput = z.infer<typeof editDeckSchema>;

export async function editDeck(input: EditDeckInput) {
  const parsed = editDeckSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }

  const { userId } = await auth();
  if (!userId) {
    return {
      error: {
        formErrors: ["Sign in to edit a deck."],
        fieldErrors: {},
      },
    };
  }

  const { deckId, name, description } = parsed.data;

  try {
    const updated = await updateDeck({
      userId,
      deckId,
      name,
      description,
    });
    if (updated.length === 0) {
      return {
        error: {
          formErrors: ["That deck was not found."],
          fieldErrors: {},
        },
      };
    }
  } catch {
    return {
      error: {
        formErrors: ["Could not save the deck."],
        fieldErrors: {},
      },
    };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/decks/${deckId}`);
  revalidatePath(`/decks/${deckId}/study`);
}

const deleteDeckSchema = z.object({
  deckId: z.number().int().positive(),
});

type DeleteDeckInput = z.infer<typeof deleteDeckSchema>;

export async function deleteDeck(input: DeleteDeckInput) {
  const parsed = deleteDeckSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }

  const { userId } = await auth();
  if (!userId) {
    return {
      error: {
        formErrors: ["Sign in to delete a deck."],
        fieldErrors: {},
      },
    };
  }

  const { deckId } = parsed.data;

  try {
    const deleted = await deleteDeckRow({ userId, deckId });
    if (deleted.length === 0) {
      return {
        error: {
          formErrors: ["That deck was not found."],
          fieldErrors: {},
        },
      };
    }
  } catch {
    return {
      error: {
        formErrors: ["Could not delete the deck."],
        fieldErrors: {},
      },
    };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/decks/${deckId}`);
  revalidatePath(`/decks/${deckId}/study`);
}

const studyProgressSchema = z.object({
  deckId: z.number().int().positive(),
  studiedCount: z.number().int().min(0),
});

type StudyProgressInput = z.infer<typeof studyProgressSchema>;

export async function recordStudyProgress(input: StudyProgressInput) {
  const parsed = studyProgressSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }

  const { userId } = await auth();
  if (!userId) {
    return {
      error: {
        formErrors: ["Sign in to study a deck."],
        fieldErrors: {},
      },
    };
  }

  const { deckId, studiedCount } = parsed.data;
  const deckCards = await getCardsByDeckId(userId, deckId);
  const completed = Math.min(studiedCount, deckCards.length);

  try {
    const updated = await setDeckStudiedCount({
      userId,
      deckId,
      studiedCount: completed,
    });
    if (updated.length === 0) {
      return {
        error: {
          formErrors: ["That deck was not found."],
          fieldErrors: {},
        },
      };
    }
  } catch {
    return {
      error: {
        formErrors: ["Could not save study progress."],
        fieldErrors: {},
      },
    };
  }

  revalidatePath(`/decks/${deckId}`);
}

const GENERATED_CARD_COUNT = 20;

const generateCardsSchema = z.object({
  deckId: z.number().int().positive(),
  topic: z.string().trim().min(1).max(20000),
  count: z.literal(GENERATED_CARD_COUNT),
});

type GenerateCardsInput = z.infer<typeof generateCardsSchema>;

const deckPromptSchema = z.object({
  description: z.string().trim().min(1, "Add a description first."),
  name: z.string().trim().min(1, "Add a title first."),
});

const generatedCardSchema = z.object({
  front: z
    .string()
    .trim()
    .min(1)
    .max(5000),
  back: z
    .string()
    .trim()
    .min(1)
    .max(5000),
});

export async function generateCards(input: GenerateCardsInput) {
  const parsed = generateCardsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }

  const { userId, has } = await auth();
  if (!userId) {
    return {
      error: {
        formErrors: ["Sign in to generate cards."],
        fieldErrors: {},
      },
    };
  }

  if (
    !has({ feature: "ai_flashcard_generation" }) &&
    !has({ plan: "pro" })
  ) {
    return {
      error: {
        formErrors: ["AI flashcard generation is a paid feature."],
        fieldErrors: {},
      },
    };
  }

  const { deckId, topic, count } = parsed.data;
  const deck = await getDeckById(userId, deckId);
  if (!deck) {
    return {
      error: {
        formErrors: ["That deck was not found."],
        fieldErrors: {},
      },
    };
  }

  const promptDeck = deckPromptSchema.safeParse({
    description: deck.description ?? "",
    name: deck.name,
  });
  if (!promptDeck.success) {
    const fieldErrors = promptDeck.error.flatten().fieldErrors;
    return {
      error: {
        formErrors: [
          fieldErrors.description?.[0] ??
            fieldErrors.name?.[0] ??
            "Add a description first.",
        ],
        fieldErrors: {},
      },
    };
  }

  let output: unknown;
  try {
    const generated = await generateText({
      model: "openai/gpt-6-astra",
      output: Output.array({
        element: z.object({
          front: z.string(),
          back: z.string(),
        }),
        minItems: count,
        maxItems: count,
      }),
      prompt: `Generate ${count} flashcards. Each card has a front and a back.

Decide the subject and how the front relates to the back only from the deck title and description below. Do not assume the subject, the language, or the card format. Do not add material those two fields do not call for.

Follow the form the title and description imply. Use a simple English word or short sentence on the front and only its direct translation on the back when the deck is specifically about learning a language that way. For every other deck, follow that deck's own subject instead.

Deck title: ${promptDeck.data.name}
Deck description: ${promptDeck.data.description}

${topic}`,
    });
    output = generated.output;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const unauthenticated =
      error instanceof Error && error.name === "GatewayAuthenticationError";
    const needsCard = message.includes("credit card");
    return {
      error: {
        formErrors: [
          unauthenticated
            ? "Could not generate cards. The AI Gateway rejected the API key."
            : needsCard
              ? "Could not generate cards. Add a credit card to the Vercel AI Gateway to unlock requests."
              : "Could not generate cards.",
        ],
        fieldErrors: {},
      },
    };
  }

  const cardsParsed = z.array(generatedCardSchema).length(count).safeParse(output);
  if (!cardsParsed.success) {
    return {
      error: {
        formErrors: ["Could not generate cards."],
        fieldErrors: {},
      },
    };
  }

  try {
    const inserted = await insertCards({
      userId,
      deckId,
      cards: cardsParsed.data.map((card) => ({
        front: card.front,
        back: card.back,
      })),
    });
    if (inserted.length !== count) {
      return {
        error: {
          formErrors: ["That deck was not found."],
          fieldErrors: {},
        },
      };
    }
  } catch {
    return {
      error: {
        formErrors: ["Could not save the generated cards."],
        fieldErrors: {},
      },
    };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/decks/${deckId}`);
  revalidatePath(`/decks/${deckId}/study`);
}
