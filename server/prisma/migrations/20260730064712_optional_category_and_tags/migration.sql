-- Category becomes optional: a node is no longer required to belong to a category
-- at creation time (the "free node/wire canvas" philosophy - categorize only if useful).
ALTER TABLE "nodes" ALTER COLUMN "category_id" DROP NOT NULL;

-- Tags: a separate, many-to-many, purely-for-grouping/filtering concept (no icon/visual
-- role, unlike node_categories) so a node can belong to any number of ad-hoc groups
-- ("friends of Cris", "family of Michael", "table:users") without affecting how it looks.
CREATE TABLE "tags" (
  "id"         TEXT NOT NULL,
  "map_id"     TEXT NOT NULL,
  "name"       TEXT NOT NULL,
  "color"      TEXT NOT NULL DEFAULT '#888888',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tags_map_id_name_key" ON "tags"("map_id", "name");

ALTER TABLE "tags" ADD CONSTRAINT "tags_map_id_fkey"
  FOREIGN KEY ("map_id") REFERENCES "maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "node_tags" (
  "node_id" TEXT NOT NULL,
  "tag_id"  TEXT NOT NULL,

  CONSTRAINT "node_tags_pkey" PRIMARY KEY ("node_id", "tag_id")
);

ALTER TABLE "node_tags" ADD CONSTRAINT "node_tags_node_id_fkey"
  FOREIGN KEY ("node_id") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "node_tags" ADD CONSTRAINT "node_tags_tag_id_fkey"
  FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
