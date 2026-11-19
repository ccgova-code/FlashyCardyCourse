import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

export function DeckSignInPrompt({ redirectUrl }: { redirectUrl: string }) {
  return (
    <Empty className="flex-none border border-border bg-card">
      <EmptyHeader>
        <EmptyTitle className="text-base text-foreground">
          Sign in to view this deck
        </EmptyTitle>
        <EmptyDescription>
          Sign in with the account that owns this deck.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex items-center gap-2">
          <SignInButton mode="modal" forceRedirectUrl={redirectUrl}>
            <Button variant="outline">Sign in</Button>
          </SignInButton>
          <SignUpButton mode="modal" forceRedirectUrl={redirectUrl}>
            <Button>Sign up</Button>
          </SignUpButton>
        </div>
      </EmptyContent>
    </Empty>
  );
}
