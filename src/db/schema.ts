import { index, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const decks = pgTable(
  "decks",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    // Clerk user id. Auth lives in Clerk, so this is not a foreign key.
    userId: varchar({ length: 255 }).notNull(),
    name: varchar({ length: 255 }).notNull(),
    description: text(),
    studiedCount: integer().default(0).notNull(),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp()
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("decks_user_id_idx").on(table.userId)],
);

export const cards = pgTable(
  "cards",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    deckId: integer()
      .notNull()
      .references(() => decks.id, { onDelete: "cascade" }),
    front: text().notNull(),
    back: text().notNull(),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp()
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("cards_deck_id_idx").on(table.deckId)],
);
