import type { Metadata } from "next";
import { PricingTable } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Pricing",
};

export default function PricingPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 bg-background px-4 py-8 text-foreground">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Pricing</h1>
        <p className="text-muted-foreground">
          Choose a plan for your flashcard decks
        </p>
      </div>
      <PricingTable
        for="user"
        highlightedPlan="pro"
        newSubscriptionRedirectUrl="/dashboard"
      />
    </main>
  );
}
