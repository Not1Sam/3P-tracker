-- =============================================
-- RBAC + RATE LIMITS
-- Run this in Supabase SQL Editor
-- =============================================

-- Add role and visibility to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'banned'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'friends_only', 'private'));

-- Rate limits table
CREATE TABLE IF NOT EXISTS rate_limits (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  count INT DEFAULT 1,
  PRIMARY KEY (user_id, action, window_start)
);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can only see their own rate limits
CREATE POLICY "Users read own rate limits"
  ON rate_limits FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own rate limits
CREATE POLICY "Users insert own rate limits"
  ON rate_limits FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own rate limits
CREATE POLICY "Users update own rate limits"
  ON rate_limits FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- BANNED USER POLICIES
-- =============================================

-- Drop existing policies to recreate
DROP POLICY IF EXISTS "Users can insert own friendships" ON friends;
DROP POLICY IF EXISTS "Users can send requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Profiles: users can insert own profile (non-banned only)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (
    auth.uid() = id AND role != 'banned'
  );

-- Friends: non-banned users only
CREATE POLICY "Users can insert own friendships"
  ON friends FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'banned')
  );

-- Friend requests: non-banned users only
CREATE POLICY "Users can send requests"
  ON friend_requests FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'banned')
  );

-- Friend requests: non-banned users can update (accept/reject)
DROP POLICY IF EXISTS "Users can update received requests" ON friend_requests;
CREATE POLICY "Users can update received requests"
  ON friend_requests FOR UPDATE USING (
    auth.uid() = receiver_id
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'banned')
  );

-- =============================================
-- VISIBILITY POLICIES (activity_feed reads)
-- =============================================
-- Activity feed: respect author's visibility setting
DROP POLICY IF EXISTS "Authenticated users can read activity feed" ON activity_feed;
CREATE POLICY "Authenticated users can read activity feed"
  ON activity_feed FOR SELECT USING (
    auth.role() = 'authenticated'
    AND (
      -- Author made it public
      EXISTS (SELECT 1 FROM profiles WHERE id = activity_feed.user_id AND visibility = 'public')
      -- Or it's the user's own feed
      OR activity_feed.user_id = auth.uid()
      -- Or author is friends_only and they are friends
      OR (
        EXISTS (SELECT 1 FROM profiles WHERE id = activity_feed.user_id AND visibility = 'friends_only')
        AND EXISTS (SELECT 1 FROM friends WHERE (user_id = auth.uid() AND friend_id = activity_feed.user_id) OR (user_id = activity_feed.user_id AND friend_id = auth.uid()))
      )
    )
  );
