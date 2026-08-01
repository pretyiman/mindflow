-- Adds map sharing: a MapCollaborator row grants a specific user EDITOR or
-- VIEWER access to someone else's map. Map.owner_id is untouched and remains
-- the sole source of truth for ownership - a collaborator row is never OWNER.
CREATE TYPE "CollaboratorRole" AS ENUM ('VIEWER', 'EDITOR');

CREATE TABLE "map_collaborators" (
    "id" TEXT NOT NULL,
    "map_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "CollaboratorRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "map_collaborators_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "map_collaborators_map_id_user_id_key" ON "map_collaborators"("map_id", "user_id");

ALTER TABLE "map_collaborators" ADD CONSTRAINT "map_collaborators_map_id_fkey" FOREIGN KEY ("map_id") REFERENCES "maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "map_collaborators" ADD CONSTRAINT "map_collaborators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
