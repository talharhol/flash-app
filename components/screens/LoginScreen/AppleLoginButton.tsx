import React from "react";
import { Platform, StyleSheet } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { OAuthProvider } from "firebase/auth";
import { IDAL } from "@/DAL/IDAL";

const AppleLoginButton: React.FC<{ dal: IDAL }> = ({ dal }) => {
    const handleAppleAuth = async () => {
        try {
            const rawNonce = Crypto.randomUUID();
            const hashedNonce = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                rawNonce
            );

            const appleCredential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
                nonce: hashedNonce,
            });

            const provider = new OAuthProvider("apple.com");
            const credential = provider.credential({
                idToken: appleCredential.identityToken!,
                rawNonce,
            });

            await dal.signin({ oauthCredential: credential });
        } catch (error: any) {
            if (error.code !== "ERR_REQUEST_CANCELED") {
                console.error(error);
                alert("Apple login failed");
            }
        }
    };

    if (Platform.OS !== "ios") return null;

    return (
        <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={8}
            style={styles.button}
            onPress={handleAppleAuth}
        />
    );
};

export default AppleLoginButton;

const styles = StyleSheet.create({
    button: {
        width: "100%",
        height: 48,
        marginTop: 15,
    },
});
