-- Shareable invite links: a MapInvite is created alongside an email invite
-- so the owner can hand the link directly to the recipient. Redemption still
-- requires login (see /invites/:token/accept) - no unauthenticated access.
CREATE TABLE "map_invites" (
    "id" TEXT NOT NULL,
    "map_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "CollaboratorRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),

    CONSTRAINT "map_invites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "map_invites_token_key" ON "map_invites"("token");

ALTER TABLE "map_invites" ADD CONSTRAINT "map_invites_map_id_fkey" FOREIGN KEY ("map_id") REFERENCES "maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
