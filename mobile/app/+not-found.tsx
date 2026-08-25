import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View style={styles.container}>
        <Text style={styles.text}>Página não encontrada</Text>
        <Link href="/" style={styles.link}>Voltar ao início</Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 18, fontFamily: 'Quicksand_600SemiBold', color: Colors.black },
  link: { marginTop: 16, color: Colors.primary, fontFamily: 'Quicksand_500Medium' },
});