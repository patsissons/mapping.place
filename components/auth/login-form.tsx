"use client";

import { type FormEvent, useState, useTransition } from "react";
import { LoaderCircle, LockKeyhole } from "lucide-react";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginFormProps = {
  callbackUrl: string;
};

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const username = formData.get("username");
    const password = formData.get("password");

    setError(null);

    startTransition(() => {
      void (async () => {
        try {
          const result = await signIn("credentials", {
            username: typeof username === "string" ? username : "",
            password: typeof password === "string" ? password : "",
            callbackUrl,
            redirect: false,
          });

          if (!result) {
            setError("Unable to sign in right now.");
            return;
          }

          if (result.error) {
            setError("Invalid username or password.");
            return;
          }

          window.location.assign(result.url ?? callbackUrl);
        } catch {
          setError("Unable to sign in right now.");
        }
      })();
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          autoCapitalize="none"
          autoComplete="username"
          autoCorrect="off"
          disabled={isPending}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          disabled={isPending}
          required
        />
      </div>
      {error ? (
        <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm text-foreground">
          {error}
        </div>
      ) : null}
      <Button className="w-full" type="submit" disabled={isPending}>
        {isPending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <LockKeyhole className="size-4" />
        )}
        {isPending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
