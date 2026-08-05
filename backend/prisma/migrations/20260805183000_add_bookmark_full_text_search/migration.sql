-- Weighted PostgreSQL full-text index: titles rank above notes.
CREATE INDEX "bookmarks_search_vector_idx" ON "bookmarks" USING GIN (
  (
    setweight(to_tsvector('english', COALESCE("title", '')), 'A') ||
    setweight(to_tsvector('english', COALESCE("notes", '')), 'B')
  )
);
