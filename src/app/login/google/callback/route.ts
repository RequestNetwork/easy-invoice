// app/login/google/callback/route.ts
import {
  createSession,
  generateSessionToken,
  setSessionTokenCookie,
} from "@/server/auth";
import { google } from "@/server/auth";
import { db } from "@/server/db";
import { userTable } from "@/server/db/schema";
import { decodeIdToken } from "arctic";
import type { OAuth2Tokens } from "arctic";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { ulid } from "ulid";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const storedState = cookieStore.get("google_oauth_state")?.value ?? null;
  const codeVerifier = cookieStore.get("google_code_verifier")?.value ?? null;
  if (
    code === null ||
    state === null ||
    storedState === null ||
    codeVerifier === null
  ) {
    return new Response(null, {
      status: 400,
    });
  }
  if (state !== storedState) {
    return new Response(null, {
      status: 400,
    });
  }

  let tokens: OAuth2Tokens;
  try {
    tokens = await google.validateAuthorizationCode(code, codeVerifier);
  } catch (_) {
    return new Response(null, {
      status: 400,
    });
  }
  interface GoogleClaims {
    sub?: string;
    name?: string;
  }
  const claims = decodeIdToken(tokens.idToken()) as GoogleClaims;
  if (!claims?.sub || !claims?.name) {
    return new Response(null, { status: 400 });
  }
  const googleUserId = claims.sub;
  const username = claims.name;

  const existingUser = await db.query.userTable.findFirst({
    where: eq(userTable.googleId, googleUserId),
  });

  if (existingUser !== null && existingUser !== undefined) {
    const sessionToken = generateSessionToken();
    const session = await createSession(
      sessionToken,
      existingUser?.id as string,
    );
    await setSessionTokenCookie(sessionToken, session.expiresAt);
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    });
  }

  const userId = ulid();

  await db
    .insert(userTable)
    .values({
      id: userId,
      googleId: googleUserId,
      name: username,
    })
    .returning();

  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, userId);
  await setSessionTokenCookie(sessionToken, session.expiresAt);
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/dashboard",
    },
  });
}
