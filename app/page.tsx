import { auth } from "@clerk/nextjs/server";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center gap-8 px-4 text-center">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">
          FlashyCardy
        </h1>
        <p className="text-lg text-muted-foreground">
          Your personal flashcard platform
        </p>
      </div>
      <Suspense>
        <HomeActions />
      </Suspense>
    </main>
  );
}

async function HomeActions() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex items-center gap-2">
      <SignInButton mode="modal" forceRedirectUrl="/dashboard">
        <Button variant="outline">Sign in</Button>
      </SignInButton>
      <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
        <Button>Sign up</Button>
      </SignUpButton>
    </div>
  );
}
