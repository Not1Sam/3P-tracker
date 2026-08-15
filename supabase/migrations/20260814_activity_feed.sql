-- Activity feed table for friend milestones and social activity
-- Created: 2026-08-14

-- 1. Create activity_feed table
CREATE TABLE IF NOT EXISTS public.activity_feed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('streak_milestone', 'logging_goal', 'friend_joined')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Enable RLS
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies
-- Users can read activity from their friends
CREATE POLICY "Users can read friend activity"
  ON public.activity_feed
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT friend_id FROM public.friends WHERE user_id = auth.uid()
    )
  );

-- Users can insert their own activity
CREATE POLICY "Users can insert own activity"
  ON public.activity_feed
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own activity
CREATE POLICY "Users can delete own activity"
  ON public.activity_feed
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 4. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id ON public.activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON public.activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_created ON public.activity_feed(user_id, created_at DESC);
