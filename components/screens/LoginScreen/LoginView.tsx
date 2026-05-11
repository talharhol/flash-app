import React, { useState } from "react";
import { Image, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { useDal } from "@/DAL/DALService";
import { ThemedText } from "../../general/ThemedText";
import { Colors } from "@/constants/Colors";
import BasicButton from "../../general/Button";
import GoogleLoginButton from "./GoogleLoginButton";
import AppleLoginButton from "./AppleLoginButton";


const LoginView: React.FC = () => {
  const dal = useDal();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async () => {
    try {
      if (isSignUp) {
        await dal.signup({ email, password });
      } else {
        await dal.signin({ email, password });
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image style={styles.logo} source={require("../../../assets/images/loggo.png")} />
        <ThemedText type="title" style={styles.appName}>Flash</ThemedText>
        <ThemedText type="default" style={styles.tagline}>Track your climbs</ThemedText>
      </View>

      <View style={styles.card}>
        <ThemedText type="subtitle" style={styles.cardTitle}>
          {isSignUp ? "Create account" : "Welcome back"}
        </ThemedText>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={Colors.backgroundDark}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={Colors.backgroundDark}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <BasicButton
          text={isSignUp ? "Sign Up" : "Log In"}
          onPress={handleAuth}
          style={styles.primaryButton}
          color={Colors.backgroundDeep}
          selected
        />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <ThemedText type="default" style={styles.dividerText}>or</ThemedText>
          <View style={styles.dividerLine} />
        </View>

        <GoogleLoginButton dal={dal} />
        <AppleLoginButton dal={dal} />

        <TouchableOpacity style={styles.switchRow} onPress={() => setIsSignUp(!isSignUp)}>
          <ThemedText type="default" style={styles.switchText}>
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
          </ThemedText>
          <ThemedText type="defaultSemiBold" style={styles.switchLink}>
            {isSignUp ? "Log In" : "Sign Up"}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LoginView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: Colors.backgroundLite,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    height: 80,
    width: 80,
    borderRadius: 20,
    marginBottom: 12,
  },
  appName: {
    color: Colors.backgroundDeep,
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 1,
  },
  tagline: {
    color: Colors.backgroundExtraDark,
    marginTop: 4,
    fontSize: 14,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    shadowColor: Colors.backgroundDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  cardTitle: {
    textAlign: "center",
    color: Colors.backgroundDeep,
    marginBottom: 20,
    fontSize: 18,
  },
  input: {
    backgroundColor: Colors.backgroundExtraLite,
    borderWidth: 1,
    borderColor: Colors.backgroundLite,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 15,
    color: Colors.textDark,
  },
  primaryButton: {
    width: "100%",
    marginTop: 4,
    height: 48,
    borderRadius: 10,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.backgroundLite,
  },
  dividerText: {
    color: Colors.backgroundExtraDark,
    marginHorizontal: 12,
    fontSize: 13,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  switchText: {
    color: Colors.backgroundExtraDark,
    fontSize: 14,
  },
  switchLink: {
    color: Colors.backgroundDeep,
    fontSize: 14,
    textDecorationLine: "underline",
  },
});
