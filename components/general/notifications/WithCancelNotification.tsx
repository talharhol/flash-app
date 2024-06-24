import { SafeAreaView, View } from "react-native";
import { ThemedText } from "../ThemedText";
import BasicButton from "../Buttom";

const WithCancelNotification: React.FC<React.ComponentProps<typeof SafeAreaView> & {
    title: string;
    description: string;
    onCancel: () => void;
  }> = ({ title, description, onCancel }) => (
    <SafeAreaView style={{ alignItems: "center", margin: 20, padding: 8, borderRadius: 8, flexDirection: 'row', backgroundColor: "white", justifyContent: "space-between"}}>
      <View>
        <ThemedText style={{ color: 'black', fontWeight: 'bold' }}>{title}</ThemedText>
        <ThemedText style={{ color: 'black' }}>{description}</ThemedText>
      </View>
      <BasicButton text="Cancel" color="red" onPress={onCancel} style={{ width: "auto" }} />
    </SafeAreaView>
  );

  export default WithCancelNotification;