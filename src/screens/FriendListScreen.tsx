import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { SearchModal } from '@/components/social/SearchModal';
import { FriendCard } from '@/components/social/FriendCard';
import { FriendRequestCard } from '@/components/social/FriendRequestCard';
import { Toast } from '@/components/common/Toast';
import * as socialService from '@/services/social-service';

interface Friend {
  friend_id: string;
  username: string;
}

interface ReceivedRequest {
  id: string;
  sender_id: string;
  username: string;
}

interface SentRequest {
  id: string;
  receiver_id: string;
  username: string;
}

export function FriendListScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { refreshPendingCount } = useProfile();

  const [friends, setFriends] = useState<Friend[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<ReceivedRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: '',
  });

  const showToast = useCallback((message: string) => {
    setToast({ visible: true, message });
  }, []);

  const hideToast = useCallback(() => {
    setToast({ visible: false, message: '' });
  }, []);

  const fetchAllData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [friendsData, receivedData, sentData] = await Promise.all([
        socialService.getFriends(user.id),
        socialService.getPendingReceivedRequests(user.id),
        socialService.getPendingSentRequests(user.id),
      ]);
      setFriends(friendsData);
      setReceivedRequests(receivedData);
      setSentRequests(sentData);
    } catch {
      showToast('Failed to load friends');
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleAcceptRequest = async (requestId: string) => {
    const accepted = receivedRequests.find((r) => r.id === requestId);
    setReceivedRequests((prev) => prev.filter((r) => r.id !== requestId));

    const { error } = await socialService.acceptFriendRequest(requestId);
    if (error) {
      showToast('Failed to accept request');
      if (accepted) setReceivedRequests((prev) => [accepted, ...prev]);
    } else {
      showToast('Friend request accepted!');
      fetchAllData();
      refreshPendingCount();
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const rejected = receivedRequests.find((r) => r.id === requestId);
    setReceivedRequests((prev) => prev.filter((r) => r.id !== requestId));

    const { error } = await socialService.rejectFriendRequest(requestId);
    if (error) {
      showToast('Failed to reject request');
      if (rejected) setReceivedRequests((prev) => [rejected, ...prev]);
    } else {
      showToast('Friend request rejected');
      refreshPendingCount();
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    const cancelled = sentRequests.find((r) => r.id === requestId);
    setSentRequests((prev) => prev.filter((r) => r.id !== requestId));

    const { error } = await socialService.cancelFriendRequest(requestId, user!.id);
    if (error) {
      showToast('Failed to cancel request');
      if (cancelled) setSentRequests((prev) => [cancelled, ...prev]);
    } else {
      showToast('Friend request cancelled');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    const removed = friends.find((f) => f.friend_id === friendId);
    setFriends((prev) => prev.filter((f) => f.friend_id !== friendId));

    const { error } = await socialService.removeFriend(user!.id, friendId);
    if (error) {
      showToast('Failed to remove friend');
      if (removed) setFriends((prev) => [...prev, removed]);
    } else {
      showToast('Friend removed');
      refreshPendingCount();
    }
  };

  const handleSelectUser = async (userId: string, username: string) => {
    setShowSearch(false);

    if (!user) return;

    const { error } = await socialService.sendFriendRequest(user.id, userId);
    if (error) {
      showToast(error);
    } else {
      showToast('Friend request sent to ' + username + '!');
      const sentData = await socialService.getPendingSentRequests(user.id);
      setSentRequests(sentData);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading friends...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Friends</Text>
        <TouchableOpacity
          style={[styles.searchBtn, { backgroundColor: colors.surfaceVariant }]}
          onPress={() => setShowSearch(true)}
        >
          <Text style={[styles.searchBtnText, { color: colors.text }]}>&#128269;</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {receivedRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              Pending Requests ({receivedRequests.length})
            </Text>
            {receivedRequests.map((request) => (
              <FriendRequestCard
                key={request.id}
                requestId={request.id}
                username={request.username}
                senderId={request.sender_id}
                type="received"
                onAccept={handleAcceptRequest}
                onReject={handleRejectRequest}
                onCancel={() => {}}
              />
            ))}
          </View>
        )}

        {sentRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              Sent Requests ({sentRequests.length})
            </Text>
            {sentRequests.map((request) => (
              <FriendRequestCard
                key={request.id}
                requestId={request.id}
                username={request.username}
                senderId={null}
                type="sent"
                onAccept={() => {}}
                onReject={() => {}}
                onCancel={handleCancelRequest}
              />
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Friends ({friends.length})
          </Text>
          {friends.length > 0 ? (
            friends.map((friend) => (
              <FriendCard
                key={friend.friend_id}
                username={friend.username}
                friendId={friend.friend_id}
                onRemove={handleRemoveFriend}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                No friends yet - search to find someone!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <SearchModal
        visible={showSearch}
        onClose={() => setShowSearch(false)}
        onSelectUser={handleSelectUser}
      />

      <Toast
        visible={toast.visible}
        message={toast.message}
        onDismiss={hideToast}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: {
    fontSize: 18,
  },
  content: {
    paddingBottom: 24,
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
