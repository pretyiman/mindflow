-- Union connector support: replaces the destructive "merge two nodes" feature with
-- an auto-created connector node between two nodes joined by a union relation type
-- (e.g. "married-to"), so each side keeps its own independent identity/relationships
-- while children can wire to the pair as a single unit.
ALTER TABLE "relation_types" ADD COLUMN "is_union" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "nodes" ADD COLUMN "is_connector" BOOLEAN NOT NULL DEFAULT false;
