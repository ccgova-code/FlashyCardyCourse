import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function HeaderAccount() {
  return (
    <>
      <Show when="signed-out">
        <div className="flex items-center gap-2">
          <SignInButton mode="modal" forceRedirectUrl="/dashboard">
            <Button variant="outline">Sign in</Button>
          </SignInButton>
          <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
            <Button>Sign up</Button>
          </SignUpButton>
        </div>
      </Show>
      <Show when="signed-in">
        <div className="flex min-h-8 min-w-8 items-center justify-end">
          <UserButton />
        </div>
      </Show>
    </>
  );
}
