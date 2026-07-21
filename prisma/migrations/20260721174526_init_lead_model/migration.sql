-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "hasWebsite" BOOLEAN NOT NULL DEFAULT false,
    "rating" REAL,
    "locationQuery" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
