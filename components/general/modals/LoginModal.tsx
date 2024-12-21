import { ThemedText } from "@/components/general/ThemedText";
import React, { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import BasicModal from "./BasicModal";
import BasicButton from "../Buttom";
import { ColorPallet } from "@/constants/Colors";
import { useDal } from "@/DAL/DALService";


const LoginModal: React.FC<React.ComponentProps<typeof BasicModal>> 
= ({ closeModal }) => {
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

        <BasicModal closeModal={closeModal}  style={styles.container}>
<View style={styles.container}>
        <Text style={styles.title}>{isSignUp ? "Sign Up" : "Login"}</Text>
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
          color="gray"
        />
      </View>        
      </BasicModal>
    );
};

export default LoginModal;

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      padding: 20,
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
    },
  });