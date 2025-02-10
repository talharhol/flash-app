import React, { useState } from "react";
import { Button, Image, StyleSheet, Text, TextInput, View } from "react-native";
import { useDal } from "@/DAL/DALService";
import { ThemedText } from "./ThemedText";


const LoginView: React.FC
  = () => {
    const dal = useDal();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);

    const handleAuth = async () => {
      try {
        if (isSignUp) {
          await dal.signup(email, password);
          alert("User created successfully!");
        } else {
          await dal.signin(email, password);
          alert("Logged in successfully!");
        }
      } catch (error) {
        console.log(error);
      }
    };

    return (
        <View style={styles.container}>
          <Image style={styles.loggo} source={require("../../assets/images/loggo.png")}/>
          <ThemedText type="subtitle" style={styles.loggoText}>Flash app</ThemedText>
          <ThemedText type="title" style={styles.title}>{isSignUp ? "Sign Up" : "Login"}</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Button title={isSignUp ? "Sign Up" : "Login"} onPress={handleAuth} />
          <Button
            title={`Switch to ${isSignUp ? "Login" : "Sign Up"}`}
            onPress={() => setIsSignUp(!isSignUp)}
            color="#555"
          />
        </View>
    );
  };

export default LoginView;

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