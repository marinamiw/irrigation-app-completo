import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function ScreenBackground({ children, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.decorativeArea} pointerEvents="none">
        <View style={[styles.ellipse, { left: -70 }]} />
        <View style={[styles.ellipse, { left: -10 }]} />
        <View style={[styles.ellipse, { left: 50 }]} />
        <View style={[styles.ellipse, { left: 110 }]} />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  decorativeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 375,
    height: 240,
    overflow: 'hidden',
  },
  ellipse: {
    position: 'absolute',
    width: 221,
    height: 240,
    borderRadius: 110,
    backgroundColor: Colors.primary,
    top: -50,
  },
});