import React, { useState } from "react";
import { Image, StyleSheet, TextInput, View } from "react-native";
import { useDal } from "@/DAL/DALService";
import { ThemedText } from "../../general/ThemedText";
import { Colors } from "@/constants/Colors";
import BasicButton from "../../general/Button";
import GoogleLoginButton from "./GoogleLoginButton";


const LoginView: React.FC
  = () => {
    const dal = useDal();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);

    const handleAuth = async () => {
      try {
        if (isSignUp) {
          await dal.signup({email, password});
        } else {
          await dal.signin({email, password});
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
          <BasicButton 
          text={isSignUp ? "Sign Up" : "Login"}
           onPress={handleAuth} 
           style={styles.button}
           color={Colors.backgroundDark} 
           selected/>
          
          <GoogleLoginButton dal={dal} />

          <BasicButton
            text={`Switch to ${isSignUp ? "Login" : "Sign Up"}`}
            onPress={() => setIsSignUp(!isSignUp)}
           style={styles.button}
            color={Colors.backgroundDark}
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
    backgroundColor: Colors.backgroundLite
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
    borderColor: Colors.backgroundExtraDark,
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  button: {
    width: "100%",
    marginTop: 15
  }
});