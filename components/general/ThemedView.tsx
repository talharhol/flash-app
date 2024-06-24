import { View } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';


const ThemedView: React.FC<React.ComponentProps<typeof View> & {
  lightColor?: string;
  darkColor?: string;
}> = ({ style, lightColor, darkColor, ...otherProps })  => {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}

export default ThemedView;