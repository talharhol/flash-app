import { SafeAreaView, View } from "react-native";
import { ThemedText } from "../ThemedText";
import BasicButton from "../Button";
import { Colors } from "@/constants/Colors";

const WithCancelNotification: React.FC<React.ComponentProps<typeof SafeAreaView> & {
    title: string;
    description: string;
    onCancel: () => void;
  }> = ({ title, description, onCancel }) => (
    <SafeAreaView style={{ alignItems: "center", margin: 20, padding: 8, borderRadius: 8, flexDirection: 'row', backgroundColor: Colors.backgroundExtraLite, justifyContent: "center"}}>
      <View>
        <ThemedText style={{ color: 'black', fontWeight: 'bold', alignSelf: "center" }}>{title}</ThemedText>
        <ThemedText style={{ alignSelf: "center" }}>{description}</ThemedText>
      </View>
      <BasicButton text="Cancel" color="red" onPress={onCancel} style={{ width: "auto", position: "absolute", right: 10}} />
    </SafeAreaView>
  );

  export default WithCancelNotification;