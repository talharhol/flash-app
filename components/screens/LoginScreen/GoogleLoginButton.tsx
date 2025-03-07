import React, { useState } from "react";
import { TouchableOpacity, Text, Image, StyleSheet, View } from "react-native";
import { GoogleSignin, isSuccessResponse } from "@react-native-google-signin/google-signin";
import {  GoogleAuthProvider } from "firebase/auth";
import { IDAL } from "@/DAL/IDAL";
import { Colors } from "@/constants/Colors";
import { ThemedText } from "@/components/general/ThemedText";

GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_EXPO_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_ISO_CLIENT_ID,
    offlineAccess: true,
    forceCodeForRefreshToken: true,
  });


const GoogleLoginButton: React.FC<{
    dal: IDAL;
}> = ({ dal }) => {
   const handleGoogleAuth = async () => {
        try {
          await GoogleSignin.hasPlayServices();
          const resp = await GoogleSignin.signIn();
          if (isSuccessResponse(resp)) 
              await dal.signin({googleCredential: GoogleAuthProvider.credential(resp.data.idToken)});
        } catch (error) {
          console.error(error);
          alert("google login failed");
        }
      };
  

  return (
    
    <TouchableOpacity style={styles.button} onPress={handleGoogleAuth}>
        <Image source={require("../../../assets/images/google.jpg")} style={styles.icon} />
        <ThemedText type="defaultSemiBold">Sign in with Google</ThemedText>
    </TouchableOpacity>
      
  );
}

export default GoogleLoginButton;

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.backgroundDark,
    borderWidth: 1,
    borderColor: Colors.backgroundExtraDark,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    elevation: 3, // Shadow for Android
    shadowColor: "#000", // Shadow for iOS
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    width: "100%",
    height: 48
  },
  icon: {
    width: 48,
    height: 48,
    position: "absolute",
    left: 0,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8
  },
  text: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  }
});
