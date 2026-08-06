import { View, Text, StyleSheet } from 'react-native';

export default function PoopScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>💩</Text>
      <Text style={styles.text}>Tap 💩 to log</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  text: {
    fontSize: 18,
    color: '#666',
  },
});
