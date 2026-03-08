"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        startTransition(() => {
          void signOut({
            callbackUrl: "/login",
          });
        });
      }}
      disabled={isPending}
    >
      <LogOut className="size-4" />
      {isPending ? "Signing out..." : "Log out"}
    </Button>
  );
}
