import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret");

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  organizationName: string;
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session-token")?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}
