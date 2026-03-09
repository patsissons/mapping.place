import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { getAppSession } from "@/lib/auth-session";
import { getMissingAppAuthEnvVars } from "@/lib/app-auth";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readCallbackUrl(value: string | string[] | undefined) {
  if (typeof value !== "string" || !value.startsWith("/")) {
    return "/" as const;
  }

  return value as `/${string}`;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const callbackUrl = readCallbackUrl(params.callbackUrl);
  const session = await getAppSession();

  if (session) {
    redirect(callbackUrl as never);
  }

  const missingEnvVars = getMissingAppAuthEnvVars();

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <Card className="w-full max-w-md border-border/60">
        <CardHeader className="space-y-3">
          <div className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
            mapping.place
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {missingEnvVars.length > 0 ? (
            <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-4 text-sm text-foreground">
              Authentication is not configured. Add these variables to
              `.env.local`: {missingEnvVars.join(", ")}.
            </div>
          ) : (
            <LoginForm callbackUrl={callbackUrl} />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
