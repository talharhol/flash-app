import { StatusBar } from "react-native";
import { Platform, StyleSheet } from "react-native";
import AppContainer from "./app/routers/AppStack";
import Test from "./app/screens/Test";

export default function App() {
  return <AppContainer />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
});
