import React, { useState } from "react";
import { Button, Image, Linking, StyleSheet, Text, TextInput, View } from "react-native";
import { useDal } from "@/DAL/DALService";


const DonationView: React.FC<{
  close: () => void;
}>
  = ({ close }) => {

    return (
      <View style={styles.container}>
        <Image style={styles.loggo} source={require("../../assets/images/loggo.png")} />
        <Text style={styles.loggoText}>Flash app</Text>
        <Text style={styles.title}>Please donate</Text>
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
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
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