-- =============================================
-- ACTIVITY_FEED TABLE
-- =============================================
-- Stores friend milestones: streaks, logging goals, achievements.
-- LEAD-11: Activity feed for friend milestones.

CREATE TABLE activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('streak_milestone', 'logging_goal', 'friend_joined')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fetching friend activity (most recent first)
CREATE INDEX idx_activity_feed_user ON activity_feed USING btree (user_id);
CREATE INDEX idx_activity_feed_created ON activity_feed USING btree (created_at DESC);

ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

-- Users can read activity from their friends
CREATE POLICY "Users can read friend activity"
  ON activity_feed FOR SELECT
  USING (
    user_id IN (
      SELECT friend_id FROM friends WHERE user_id = auth.uid()
    )
  );

-- Users can insert their own milestones
CREATE POLICY "Users can insert own milestones"
  ON activity_feed FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own activity entries
CREATE POLICY "Users can delete own activity"
  ON activity_feed FOR DELETE
  USING (auth.uid() = user_id);
