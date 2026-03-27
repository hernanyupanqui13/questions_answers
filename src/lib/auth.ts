import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET environment variable");
}

export interface AdminTokenPayload {
  roomId: string; // the room's cuid id
  role: "admin";
}

/** Signs a JWT for admin access to a specific room. */
export function signAdminToken(roomId: string): string {
  return jwt.sign({ roomId, role: "admin" } satisfies AdminTokenPayload, JWT_SECRET, {
    expiresIn: "12h",
  });
}

/** Verifies an admin JWT. Returns the payload or throws. */
export function verifyAdminToken(token: string): AdminTokenPayload {
  const payload = jwt.verify(token, JWT_SECRET) as AdminTokenPayload;
  if (payload.role !== "admin") throw new Error("Invalid token role");
  return payload;
}

/** Extracts the Bearer token from an Authorization header. */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}
