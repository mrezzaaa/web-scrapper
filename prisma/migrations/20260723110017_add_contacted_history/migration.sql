-- CreateTable
CREATE TABLE "ContactedHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "originalLeadId" TEXT,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "formattedMessage" TEXT NOT NULL,
    "contactedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
