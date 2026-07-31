-- CreateTable
CREATE TABLE "maps" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "node_categories" (
    "id" TEXT NOT NULL,
    "map_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '❓',
    "color" TEXT NOT NULL DEFAULT '#888888',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "node_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relation_types" (
    "id" TEXT NOT NULL,
    "map_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_directional" BOOLEAN NOT NULL DEFAULT true,
    "is_hierarchy" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT NOT NULL DEFAULT '#cccccc',
    "line_style" TEXT NOT NULL DEFAULT 'solid',
    "max_outgoing_per_source" INTEGER,
    "max_incoming_per_target" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "relation_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nodes" (
    "id" TEXT NOT NULL,
    "map_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "name" TEXT NOT NULL,
    "icon_override" TEXT,
    "color_override" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "properties" JSONB NOT NULL DEFAULT '{}',
    "pos_x" DOUBLE PRECISION,
    "pos_y" DOUBLE PRECISION,
    "pos_z" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "edges" (
    "id" TEXT NOT NULL,
    "map_id" TEXT NOT NULL,
    "source_node_id" TEXT NOT NULL,
    "target_node_id" TEXT NOT NULL,
    "relation_type_id" TEXT NOT NULL,
    "label_override" TEXT,
    "properties" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "edges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "node_categories_map_id_name_key" ON "node_categories"("map_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "relation_types_map_id_name_key" ON "relation_types"("map_id", "name");

-- CreateIndex
CREATE INDEX "nodes_map_id_idx" ON "nodes"("map_id");

-- CreateIndex
CREATE INDEX "nodes_parent_id_idx" ON "nodes"("parent_id");

-- CreateIndex
CREATE INDEX "nodes_category_id_idx" ON "nodes"("category_id");

-- CreateIndex
CREATE INDEX "edges_map_id_idx" ON "edges"("map_id");

-- CreateIndex
CREATE INDEX "edges_source_node_id_idx" ON "edges"("source_node_id");

-- CreateIndex
CREATE INDEX "edges_target_node_id_idx" ON "edges"("target_node_id");

-- CreateIndex
CREATE INDEX "edges_relation_type_id_idx" ON "edges"("relation_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "edges_source_node_id_target_node_id_relation_type_id_key" ON "edges"("source_node_id", "target_node_id", "relation_type_id");

-- AddForeignKey
ALTER TABLE "node_categories" ADD CONSTRAINT "node_categories_map_id_fkey" FOREIGN KEY ("map_id") REFERENCES "maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relation_types" ADD CONSTRAINT "relation_types_map_id_fkey" FOREIGN KEY ("map_id") REFERENCES "maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_map_id_fkey" FOREIGN KEY ("map_id") REFERENCES "maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "node_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edges" ADD CONSTRAINT "edges_map_id_fkey" FOREIGN KEY ("map_id") REFERENCES "maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edges" ADD CONSTRAINT "edges_source_node_id_fkey" FOREIGN KEY ("source_node_id") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edges" ADD CONSTRAINT "edges_target_node_id_fkey" FOREIGN KEY ("target_node_id") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edges" ADD CONSTRAINT "edges_relation_type_id_fkey" FOREIGN KEY ("relation_type_id") REFERENCES "relation_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateExtension (uuid generation, referenced by other Postgres tooling e.g. future Apache AGE use)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- AddCheckConstraint (an edge cannot connect a node to itself)
ALTER TABLE "edges" ADD CONSTRAINT "edges_source_ne_target_check" CHECK ("source_node_id" <> "target_node_id");

-- CreateIndex (GIN index for querying inside the free-form properties JSONB)
CREATE INDEX "nodes_properties_gin" ON "nodes" USING GIN ("properties");
