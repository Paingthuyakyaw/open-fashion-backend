import jwt, { type SignOptions } from "jsonwebtoken";
import type { Role } from "../generated/prisma/client";

export type TokenPayload = {
  userId: string;
  email: string;
  role: Role;
};

function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "JWT_SECRET is required. Set a long random value in the environment.",
    );
  }
  return secret;
}

const JWT_SECRET = requireJwtSecret();
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"];

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
