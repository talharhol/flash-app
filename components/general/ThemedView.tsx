import { View } from 'react-native';



const ThemedView: React.FC<React.ComponentProps<typeof View> & {
  lightColor?: string;
  darkColor?: string;
}> = ({ style, lightColor, darkColor, ...otherProps }) => {

  return <View style={[{ backgroundColor: darkColor }, style]} {...otherProps} />;
}

export default ThemedView;