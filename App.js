import { NavigationContainer } from '@react-navigation/native';
import {StatusBar} from 'react-native';
import { Platform, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import AppContainer from './app/routers/AppStack';
import HomeCategoriesTabs from './app/routers/HomeCategoriesTabs';


export default function App() {
  return (
    <AppContainer />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
});
