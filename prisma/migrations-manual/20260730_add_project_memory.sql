-- Project memory + agent change log.
--
-- Purely additive: five new tables, no changes to any existing table.
-- Apply with `npx prisma db push` (matches this repo's existing workflow) or by
-- running this file directly against DATABASE_URL_UNPOOLED.
--
-- Generated offline with:
--   npx prisma migrate diff --from-schema-datamodel <previous> \
--     --to-schema-datamodel prisma/schema.prisma --script

-- CreateTable
CREATE TABLE "ProjectMemory" (
    "id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "designTokens" TEXT,
    "digest" TEXT,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "ProjectMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemoryPage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "memoryId" TEXT NOT NULL,

    CONSTRAINT "MemoryPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemorySection" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "tokens" TEXT,
    "pageId" TEXT NOT NULL,

    CONSTRAINT "MemorySection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemoryComponent" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "value" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "memorySectionId" TEXT NOT NULL,

    CONSTRAINT "MemoryComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectChange" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "request" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'applied',
    "passed" BOOLEAN NOT NULL DEFAULT true,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "plan" TEXT,
    "patch" TEXT,
    "issues" TEXT,
    "trace" TEXT,
    "versionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "ProjectChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMemory_projectId_key" ON "ProjectMemory"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "MemoryPage_memoryId_slug_key" ON "MemoryPage"("memoryId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "MemorySection_pageId_key_key" ON "MemorySection"("pageId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "MemoryComponent_memorySectionId_key_key" ON "MemoryComponent"("memorySectionId", "key");

-- CreateIndex
CREATE INDEX "ProjectChange_projectId_createdAt_idx" ON "ProjectChange"("projectId", "createdAt");

-- AddForeignKey
ALTER TABLE "ProjectMemory" ADD CONSTRAINT "ProjectMemory_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryPage" ADD CONSTRAINT "MemoryPage_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "ProjectMemory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemorySection" ADD CONSTRAINT "MemorySection_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "MemoryPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryComponent" ADD CONSTRAINT "MemoryComponent_memorySectionId_fkey" FOREIGN KEY ("memorySectionId") REFERENCES "MemorySection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectChange" ADD CONSTRAINT "ProjectChange_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

