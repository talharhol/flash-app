import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { createAppContainer } from "react-navigation";
import { createStackNavigator } from "react-navigation-stack";
import { SimpleLineIcons } from '@expo/vector-icons';

import Home from "../screens/HomeScreen";
import GymScreen from "../screens/GymScreen";
import WallScreen from "../screens/WallScreen";
import ProblemScreen from "../screens/ProblemScreen";
import SelectHoldsScreen from "../screens/SelectHoldsScreen";
import CreateProblemScreen from "../screens/CreateProblemScreen";
import UserSettingScreen from "../screens/UserSettingsScreen";
import CreateGymScreen from "../screens/CreateGymScreen";

function Header({ navigation, noSettings }) {
    return (
    <View style={styles.headerBox}>
        <Text>Flash</Text>
        {
            noSettings === undefined ? (<TouchableOpacity style={{ alignSelf: "flex-end", position: "absolute"}} onPress={() => navigation.navigate('UserSettingScreen')}>
            <SimpleLineIcons name="settings" size={24} color="black" />
        </TouchableOpacity>) : <View/>
        }
    </View>);
}


const screens = {
    Home: {
        screen: Home,
        navigationOptions: ({ navigation }) => {
            return {
                headerTitle: () => <Header navigation={navigation} />,
                headerLeft: () => null
            }
        }
    },
    GymScreen: {
        screen: GymScreen,
        navigationOptions: ({ navigation }) => {
            return {
                headerTitle: () => <Header navigation={navigation} />,
                headerLeft: () => null
            }
        }
    },
    WallScreen: {
        screen: WallScreen,
        navigationOptions: ({ navigation }) => {
            return {
                headerTitle: () => <Header navigation={navigation} />,
                headerLeft: () => null
            }
        }
    },
    ProblemScreen: {
        screen: ProblemScreen,
        navigationOptions: {
            headerShown: false,
        }
    },
    SelectHoldsScreen: {
        screen: SelectHoldsScreen,
        navigationOptions: {
            headerShown: false,
        }
    },
    CreateProblemScreen: {
        screen: CreateProblemScreen,
        navigationOptions: {
            headerShown: false,
        }
    },
    CreateGymScreen: {
        screen: CreateGymScreen,
        navigationOptions: {
            headerShown: false,
        }
    },
    UserSettingScreen: {
        screen: UserSettingScreen,
        navigationOptions: ({ navigation }) => {
            return {
                headerTitle: () => <Header navigation={navigation} noSettings/>,
                headerLeft: () => null
            }
        }
    },

}

const AppStack = createStackNavigator(screens);

const AppContainer = createAppContainer(AppStack);
export default AppContainer;
const styles = StyleSheet.create({
    headerBox: {height: 50, width: "100%", justifyContent: "center", alignItems: "center"}
})