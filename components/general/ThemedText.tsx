import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
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
        { color: lite ? Colors.textLite : Colors.textDark, fontFamily: Fonts.regular },
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
    fontFamily: Fonts.bold,
  },
  title1: {
    fontSize: 30,
    fontFamily: Fonts.bold,
  },
  title2: {
    fontSize: 28,
    fontFamily: Fonts.bold,
  },
  title3: {
    fontSize: 26,
    fontFamily: Fonts.bold,
  },
  subtitle: {
    fontSize: 24,
    fontFamily: Fonts.bold,
  },
  subtitle1: {
    fontSize: 22,
    fontFamily: Fonts.bold,
  },
  subtitle2: {
    fontSize: 20,
    fontFamily: Fonts.bold,
  },
  subtitle3: {
    fontSize: 18,
    fontFamily: Fonts.bold,
  },
  default: {
    fontSize: 16,
  },
  defaultSemiBold: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  default1: {
    fontSize: 14,
  },
  defaultSemiBold1: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  default2: {
    fontSize: 12,
  },
  defaultSemiBold2: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
  },
  default3: {
    fontSize: 10,
  },
  defaultSemiBold3: {
    fontSize: 10,
    fontFamily: Fonts.semiBold,
  },
});
