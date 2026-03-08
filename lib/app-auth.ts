const STATIC_USER_ID = "mapping-place-admin";

function readTrimmedEnv(name: string) {
  return process.env[name]?.trim() ?? "";
}

function readAuthSecret() {
  return (
    process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim() || ""
  );
}

export function getMissingAppAuthEnvVars() {
  const missing: string[] = [];

  if (!readAuthSecret()) {
    missing.push("AUTH_SECRET or NEXTAUTH_SECRET");
  }

  if (!readTrimmedEnv("APP_AUTH_USERNAME")) {
    missing.push("APP_AUTH_USERNAME");
  }

  if ((process.env.APP_AUTH_PASSWORD ?? "").length === 0) {
    missing.push("APP_AUTH_PASSWORD");
  }

  return missing;
}

export function isAppAuthConfigured() {
  return getMissingAppAuthEnvVars().length === 0;
}

export function getAppAuthSecret() {
  return readAuthSecret() || undefined;
}

export function authorizeAppUser(username: string, password: string) {
  if (!isAppAuthConfigured()) {
    return null;
  }

  const expectedUsername = readTrimmedEnv("APP_AUTH_USERNAME");
  const expectedPassword = process.env.APP_AUTH_PASSWORD ?? "";

  if (username.trim() !== expectedUsername || password !== expectedPassword) {
    return null;
  }

  return {
    id: STATIC_USER_ID,
    name: expectedUsername,
  };
}
