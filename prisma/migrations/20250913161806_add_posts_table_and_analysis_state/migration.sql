/*
  Warnings:

  - You are about to drop the column `criteriaEvaluation` on the `analyses` table. All the data in the column will be lost.
  - You are about to drop the column `focusAreas` on the `analyses` table. All the data in the column will be lost.
  - You are about to drop the column `representativePosts` on the `analyses` table. All the data in the column will be lost.
  - You are about to drop the column `sampledPosts` on the `analyses` table. All the data in the column will be lost.
  - You are about to drop the column `scoreJustification` on the `analyses` table. All the data in the column will be lost.
  - You are about to drop the column `strengths` on the `analyses` table. All the data in the column will be lost.
  - Added the required column `sections` to the `analyses` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileUrl" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "bio" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "followerCount" INTEGER,
    "posts" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_analyses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileUrl" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "requestedBy" TEXT,
    "postsId" TEXT,
    "state" TEXT NOT NULL DEFAULT 'COMPLETED',
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastRetryAt" DATETIME,
    "crediScore" REAL NOT NULL,
    "sections" JSONB NOT NULL,
    "processingTimeMs" INTEGER,
    "modelUsed" TEXT,
    "tokensUsed" INTEGER,
    "analysisPrompt" TEXT,
    "scoringPrompt" TEXT,
    CONSTRAINT "analyses_postsId_fkey" FOREIGN KEY ("postsId") REFERENCES "posts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_analyses" ("createdAt", "crediScore", "expiresAt", "id", "modelUsed", "platform", "processingTimeMs", "profileUrl", "tokensUsed", "username") SELECT "createdAt", "crediScore", "expiresAt", "id", "modelUsed", "platform", "processingTimeMs", "profileUrl", "tokensUsed", "username" FROM "analyses";
DROP TABLE "analyses";
ALTER TABLE "new_analyses" RENAME TO "analyses";
CREATE INDEX "analyses_state_idx" ON "analyses"("state");
CREATE INDEX "analyses_profileUrl_state_idx" ON "analyses"("profileUrl", "state");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "posts_profileUrl_idx" ON "posts"("profileUrl");

-- CreateIndex
CREATE INDEX "posts_expiresAt_idx" ON "posts"("expiresAt");
