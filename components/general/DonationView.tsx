import React from "react";
import { Image, Linking, StyleSheet, View } from "react-native";
import { ThemedText } from "./ThemedText";
import BasicButton from "./Button";
import { Colors } from "@/constants/Colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";


const DonationView: React.FC<{
  close: () => void;
}>
  = ({ close }) => {

    return (
      <View style={styles.container}>
        <Image style={styles.loggo} source={require("../../assets/images/loggo.png")} />
        <ThemedText type="subtitle" style={[styles.text, { marginBottom: 40 }]}>Flash app</ThemedText>
        <ThemedText type="default1" style={[styles.text, { marginBottom: 5 }]}>Are you ynjoying the app?</ThemedText>
        <ThemedText type="title" style={[styles.text, { marginBottom: 20 }]}>Please donate</ThemedText>
        <ThemedText type="subtitle3" style={styles.text}>This app is given for free</ThemedText>
        <ThemedText type="subtitle3" style={styles.text}>However, it costs money to maintain</ThemedText>
        <ThemedText type="subtitle3" style={styles.text}>In order to continue operating we relay on donaitions</ThemedText>

        <BasicButton
          color={Colors.backgroundDark} selected
          style={{ marginTop: 40 }}
          onPress={() => Linking.openURL("https://buymeacoffee.com/flashapp")}
          text="I want to donate"
        />

        <MaterialCommunityIcons
          style={{ position: "absolute", top: 20, right: 20 }}
          onPress={close} name="close-thick" size={25} color={Colors.backgroundDark}
        />
      </View>
    );
  };

export default DonationView;

const styles = StyleSheet.create({
  loggo: {
    height: 100,
    width: 100,
    alignSelf: "center"
  },
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: Colors.backgroundExtraLite
  },
  text: {
    textAlign: "center",
  }
});