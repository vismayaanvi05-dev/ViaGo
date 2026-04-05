import React from 'react';
import { View, ViewProps } from 'react-native';

interface LinearGradientProps extends ViewProps {
  colors?: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

export const LinearGradient = ({ colors, style, children, ...props }: LinearGradientProps) => {
  return (
    <View style={[{ backgroundColor: colors?.[0] || 'transparent' }, style]} {...props}>
      {children}
    </View>
  );
};
