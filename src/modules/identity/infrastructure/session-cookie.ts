import { cookies } from "next/headers";
import { SESSION_DURATION_SECONDS } from "../domain/session";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "ebook_session";

export function setSessionCookie(token: string): void {
  cookies().set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export function getSessionCookie(): string | undefined {
  return cookies().get(COOKIE_NAME)?.value;
}

export function clearSessionCookie(): void {
  cookies().delete(COOKIE_NAME);
}
