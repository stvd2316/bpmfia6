-- Schema database Better Auth untuk Supabase Postgres
-- Cara pakai: dashboard Supabase → SQL Editor → paste semua baris ini → Run.
-- (Hanya perlu dijalankan SEKALI.)

CREATE TABLE IF NOT EXISTS "user" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  "image" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" TEXT PRIMARY KEY,
  "expiresAt" TIMESTAMP NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "account" (
  "id" TEXT PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMP,
  "refreshTokenExpiresAt" TIMESTAMP,
  "scope" TEXT,
  "password" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "verification" (
  "id" TEXT PRIMARY KEY,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP,
  "updatedAt" TIMESTAMP
);

CREATE INDEX IF NOT EXISTS session_user_idx ON "session"("userId");
CREATE INDEX IF NOT EXISTS session_token_idx ON "session"("token");
CREATE INDEX IF NOT EXISTS verification_identifier_idx ON "verification"("identifier");

-- Daftar email admin (dikelola runtime dari dashboard admin)
CREATE TABLE IF NOT EXISTS "admin_emails" (
  "email" TEXT PRIMARY KEY,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);
INSERT INTO "admin_emails" ("email") VALUES ('stvd2316@gmail.com'), ('reformasibpmfiaui@gmail.com')
ON CONFLICT ("email") DO NOTHING;
