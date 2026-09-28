import { View, Text, StyleSheet } from 'react-native'

export function GoalsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Metas</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
  },
})