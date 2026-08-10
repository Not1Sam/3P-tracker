import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Avatar } from '@/components/social/Avatar';

interface FriendCardProps {
  username: string;
  friendId: string;
  onRemove: (friendId: string) => void;
}

export function FriendCard({ username, friendId, onRemove }: FriendCardProps) {
  const colors = useThemeColors();

  const handleRemove = () => {
    Alert.alert(
      'Remove Friend',
      `Remove ${username} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onRemove(friendId),
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { borderBottomColor: colors.borderLight }]}>
      <Avatar username={username} size={40} />
      <Text style={[styles.username, { color: colors.text }]}>{username}</Text>
      <TouchableOpacity onPress={handleRemove} style={styles.removeBtn}>
        <Text style={[styles.removeText, { color: colors.error }]}>Remove</Text>
      </TouchableOpacity>
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
  removeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  removeText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
