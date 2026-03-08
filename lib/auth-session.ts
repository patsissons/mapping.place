import "server-only";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";

export function getAppSession() {
  return getServerSession(authOptions);
}
