import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Avatar } from '@/components/social/Avatar';

interface FriendRequestCardProps {
  requestId: string;
  username: string;
  senderId: string | null;
  type: 'sent' | 'received';
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
  onCancel: (requestId: string) => void;
}

export function FriendRequestCard({
  requestId,
  username,
  senderId: _senderId,
  type,
  onAccept,
  onReject,
  onCancel,
}: FriendRequestCardProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { borderBottomColor: colors.borderLight }]}>
      <Avatar username={username} size={40} />
      <Text style={[styles.username, { color: colors.text }]}>{username}</Text>
      <View style={styles.actions}>
        {type === 'received' ? (
          <>
            <TouchableOpacity
              style={[styles.acceptBtn, { backgroundColor: colors.success }]}
              onPress={() => onAccept(requestId)}
            >
              <Text style={styles.acceptBtnText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rejectBtn, { borderColor: colors.error }]}
              onPress={() => onReject(requestId)}
            >
              <Text style={[styles.rejectBtnText, { color: colors.error }]}>Reject</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.cancelBtn, { borderColor: colors.border }]}
            onPress={() => onCancel(requestId)}
          >
            <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  username: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  acceptBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  rejectBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  rejectBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
