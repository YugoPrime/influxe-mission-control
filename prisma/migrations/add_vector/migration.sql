CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE "AgentActivity" ADD COLUMN IF NOT EXISTS "embedding" vector(1536);
CREATE INDEX IF NOT EXISTS "agent_activity_embedding_idx" ON "AgentActivity" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);
