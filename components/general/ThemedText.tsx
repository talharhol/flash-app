import { Colors } from '@/constants/Colors';
import { Text, type TextProps, StyleSheet } from 'react-native';


export type ThemedTextProps = TextProps & {
  lite?: boolean;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'default1' | 'title1' | 'defaultSemiBold1' | 'subtitle1' | 'default2' | 'title2' | 'defaultSemiBold2' | 'subtitle2' | 'default3' | 'title3' | 'defaultSemiBold3' | 'subtitle3';
};

export function ThemedText({
  style,
  lite,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  return (
    <Text
      style={[
        { color: lite ? Colors.textLite : Colors.textDark, fontFamily: 'Nunito' },
        styles[type],
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  title1: {
    fontSize: 30,
    fontWeight: 'bold',
    lineHeight: 30,
  },
  title2: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 28,
  },
  title3: {
    fontSize: 26,
    fontWeight: 'bold',
    lineHeight: 26,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle1: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitle2: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle3: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  default: {
    fontSize: 16,
  },
  defaultSemiBold: {
    fontSize: 16,
    fontWeight: '600',
  },
  default1: {
    fontSize: 14,
  },
  defaultSemiBold1: {
    fontSize: 14,
    fontWeight: '600',
  },
  default2: {
    fontSize: 12,
  },
  defaultSemiBold2: {
    fontSize: 12,
    fontWeight: '600',
  },
  default3: {
    fontSize: 10,
  },
  defaultSemiBold3: {
    fontSize: 10,
    fontWeight: '600',
  },
});
