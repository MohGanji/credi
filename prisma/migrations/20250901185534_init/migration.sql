-- CreateTable
CREATE TABLE "analyses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileUrl" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "sampledPosts" INTEGER NOT NULL,
    "crediScore" REAL NOT NULL,
    "focusAreas" JSONB NOT NULL,
    "strengths" JSONB NOT NULL,
    "criteriaEvaluation" JSONB NOT NULL,
    "representativePosts" JSONB NOT NULL,
    "scoreJustification" JSONB NOT NULL,
    "processingTimeMs" INTEGER,
    "modelUsed" TEXT,
    "tokensUsed" INTEGER
);

-- CreateIndex
CREATE UNIQUE INDEX "analyses_profileUrl_key" ON "analyses"("profileUrl");
