-- Reverts the edge-fusion/trunk-rendering experiment (mergeGroupId) back to
-- plain individual edges, and replaces it with a purely visual node-grouping
-- container: NodeGroup wraps 2+ nodes into one draggable box while each member
-- keeps its own independent identity, edges, notes and properties.
ALTER TABLE "edges" DROP COLUMN "merge_group_id";

CREATE TABLE "node_groups" (
    "id" TEXT NOT NULL,
    "map_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "color" TEXT NOT NULL DEFAULT '#4a4a6a',
    "pos_x" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pos_y" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "width" DOUBLE PRECISION NOT NULL DEFAULT 240,
    "height" DOUBLE PRECISION NOT NULL DEFAULT 160,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "node_groups_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "nodes" ADD COLUMN "group_id" TEXT;
CREATE INDEX "nodes_group_id_idx" ON "nodes"("group_id");

ALTER TABLE "node_groups" ADD CONSTRAINT "node_groups_map_id_fkey" FOREIGN KEY ("map_id") REFERENCES "maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "node_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
