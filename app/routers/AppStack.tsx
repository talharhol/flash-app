import { SimpleLineIcons } from '@expo/vector-icons';
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import CreateGymScreen from "../screens/CreateGymScreen";
import CreateProblemScreen from "../screens/CreateProblemScreen";
import CreateWallScreen from "../screens/CreateWallScreen";
import EditGymScreen from "../screens/EditGymScreen";
import EditWallScreen from "../screens/EditWallScreen";
import GymScreen from "../screens/GymScreen";
import HomeScreen from "../screens/HomeScreen";
import ProblemScreen from "../screens/ProblemScreen";
import SelectHoldsScreen from "../screens/SelectHoldsScreen/SelectHoldsScreen";
import UserSettingScreen from "../screens/UserSettingsScreen";
import WallScreen from "../screens/WallScreen";


const Header: React.FC<{ navigation: any, noSettings?: boolean; }> = ({ navigation, noSettings }) => {
    return (
        <View style={styles.headerBox}>
            <Text style={{ alignSelf: "center" }} onPress={() => navigation.navigate("HomeScreen")} >Flash</Text>
            {
                noSettings ? null : (
                    <TouchableOpacity style={{ alignSelf: "flex-end" }} onPress={() => navigation.navigate('UserSettingScreen')}>
                        <SimpleLineIcons name="settings" size={24} color="black" />
                    </TouchableOpacity>
                )
            }
        </View>
    );
};


const Stack = createStackNavigator();
const HeaderNavigatorOptions: React.ComponentProps<(typeof Stack)["Screen"]>["options"] = ({ navigation }) => ({
    headerTitle: () => <Header navigation={navigation} />,
    headerLeft: null,
});
const HeaderNavigatorOptionsNoSettings: React.ComponentProps<(typeof Stack)["Screen"]>["options"] = ({ navigation }) => ({
    headerTitle: () => <Header navigation={navigation} noSettings />,
    headerLeft: null,
});

function AppContainer() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Home">
                <Stack.Screen name="Home" component={HomeScreen} options={HeaderNavigatorOptions} />
                <Stack.Screen name="GymScreen" component={GymScreen} options={HeaderNavigatorOptions} />
                <Stack.Screen name="WallScreen" component={WallScreen} options={HeaderNavigatorOptions} />
                <Stack.Screen name="ProblemScreen" component={ProblemScreen} options={HeaderNavigatorOptions} />
                <Stack.Screen name="SelectHoldsScreen" component={SelectHoldsScreen} />
                <Stack.Screen name="CreateProblemScreen" component={CreateProblemScreen} />
                <Stack.Screen name="CreateGymScreen" component={CreateGymScreen} />
                <Stack.Screen name="CreateWallScreen" component={CreateWallScreen} />
                <Stack.Screen name="UserSettingScreen" component={UserSettingScreen} options={HeaderNavigatorOptionsNoSettings} />
                <Stack.Screen name="EditGymScreen" component={EditGymScreen} options={HeaderNavigatorOptionsNoSettings} />
                <Stack.Screen name="EditWallScreen" component={EditWallScreen} options={HeaderNavigatorOptionsNoSettings} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
export default AppContainer;
const headerSidePadding = 20;
const styles = StyleSheet.create({
    headerBox: { height: 30, width: "100%", justifyContent: "space-between", paddingLeft: headerSidePadding, paddingRight: headerSidePadding, display: "flex", flexDirection: "row" }
});