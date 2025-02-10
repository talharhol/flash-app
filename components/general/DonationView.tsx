import React, { useState } from "react";
import { Button, Image, Linking, StyleSheet, Text, TextInput, View } from "react-native";
import { useDal } from "@/DAL/DALService";
import { ThemedText } from "./ThemedText";


const DonationView: React.FC<{
  close: () => void;
}>
  = ({ close }) => {

    return (
      <View style={styles.container}>
        <Image style={styles.loggo} source={require("../../assets/images/loggo.png")} />
        <ThemedText type="subtitle" style={styles.loggoText}>Flash app</ThemedText>
        <ThemedText type="title" style={styles.title}>Please donate</ThemedText>
        <Button onPress={() => Linking.openURL("https://buymeacoffee.com/flashapp")} title="I want to donate" />
        <Button onPress={close} title="Close" />
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
    padding: 20,
    backgroundColor: "grey"
  },
  loggoText: {
    textAlign: "center",
    marginBottom: 40,
  },
  title: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  }
});