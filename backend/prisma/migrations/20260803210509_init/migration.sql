-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "external_issuer" VARCHAR(512) NOT NULL,
    "external_subject" VARCHAR(255) NOT NULL,
    "email" VARCHAR(320),
    "display_name" VARCHAR(200),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "owner_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookmarks" (
    "id" UUID NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "notes" TEXT,
    "collection_id" UUID,
    "collection_owner_id" UUID,
    "owner_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_external_issuer_external_subject_key" ON "users"("external_issuer", "external_subject");

-- CreateIndex
CREATE INDEX "collections_owner_id_created_at_idx" ON "collections"("owner_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "collections_id_owner_id_key" ON "collections"("id", "owner_id");

-- CreateIndex
CREATE INDEX "bookmarks_owner_id_created_at_idx" ON "bookmarks"("owner_id", "created_at");

-- CreateIndex
CREATE INDEX "bookmarks_owner_id_collection_id_created_at_idx" ON "bookmarks"("owner_id", "collection_id", "created_at");

-- CreateIndex
CREATE INDEX "bookmarks_collection_id_collection_owner_id_idx" ON "bookmarks"("collection_id", "collection_owner_id");

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_collection_id_collection_owner_id_fkey" FOREIGN KEY ("collection_id", "collection_owner_id") REFERENCES "collections"("id", "owner_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- A bookmark may only reference a collection owned by the bookmark owner.
-- Both internal collection relation fields must be null for uncategorised bookmarks.
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_collection_owner_consistency" CHECK (
    ("collection_id" IS NULL AND "collection_owner_id" IS NULL)
    OR (
        "collection_id" IS NOT NULL
        AND "collection_owner_id" IS NOT NULL
        AND "collection_owner_id" = "owner_id"
    )
);
