import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';

/**
 * Small attribution footer for screens that display BoardGameGeek-sourced data.
 * BGG's API terms of use require public-facing apps to show this credit.
 * See: https://boardgamegeek.com/wiki/page/XML_API_Terms_of_Use
 */
export function PoweredByBgg() {
  return (
    <TouchableOpacity
      style={styles.wrap}
      onPress={() => Linking.openURL('https://boardgamegeek.com')}
      accessibilityRole="link"
    >
      <Text style={styles.text}>
        Powered by <Text style={styles.brand}>BoardGameGeek</Text>
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  text: { fontSize: 11, color: '#9ca3af' },
  brand: { color: '#6b7280', fontWeight: '600' },
});
