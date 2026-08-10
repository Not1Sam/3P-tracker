-- =============================================
-- PROFILES TABLE
-- =============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enforce lowercase username
ALTER TABLE profiles ADD CONSTRAINT username_lowercase CHECK (username = lower(username));

-- Enforce character restrictions (3-20 chars, a-z 0-9 _)
ALTER TABLE profiles ADD CONSTRAINT username_format CHECK (username ~ '^[a-z0-9_]{3,20}$');

-- Index for prefix search (CRITICAL for performance)
CREATE INDEX idx_profiles_username ON profiles USING btree (username);

-- RLS: Enable and policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read profiles (for search)
CREATE POLICY "Profiles are publicly readable"
  ON profiles FOR SELECT
  USING (true);

-- Users can only insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- =============================================
-- FRIENDS TABLE (symmetric)
-- =============================================
CREATE TABLE friends (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, friend_id)
);

-- Index for friend lookups
CREATE INDEX idx_friends_user ON friends USING btree (user_id);

ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Users can only see their own friends
CREATE POLICY "Users can read own friends"
  ON friends FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert friendships (both directions handled by app)
CREATE POLICY "Users can insert own friendships"
  ON friends FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own friendships
CREATE POLICY "Users can delete own friendships"
  ON friends FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- FRIEND_REQUESTS TABLE
-- =============================================
CREATE TABLE friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

CREATE INDEX idx_friend_requests_receiver ON friend_requests USING btree (receiver_id);
CREATE INDEX idx_friend_requests_sender ON friend_requests USING btree (sender_id);

ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- Users can see requests they sent or received
CREATE POLICY "Users can read own requests"
  ON friend_requests FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send requests
CREATE POLICY "Users can send requests"
  ON friend_requests FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Users can update requests they received (accept/reject)
CREATE POLICY "Users can update received requests"
  ON friend_requests FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Users can delete requests they sent (cancel)
CREATE POLICY "Users can delete sent requests"
  ON friend_requests FOR DELETE
  USING (auth.uid() = sender_id);

-- =============================================
-- INVITE_CODES TABLE
-- =============================================
CREATE TABLE invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invite_codes_code ON invite_codes USING btree (code);

ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Users can read their own invite codes
CREATE POLICY "Users can read own invite codes"
  ON invite_codes FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create invite codes
CREATE POLICY "Users can create invite codes"
  ON invite_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own invite codes (mark as used)
CREATE POLICY "Users can update own invite codes"
  ON invite_codes FOR UPDATE
  USING (auth.uid() = user_id);
