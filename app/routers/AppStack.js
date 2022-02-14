import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { createAppContainer } from "react-navigation";
import { createStackNavigator } from "react-navigation-stack";
import { SimpleLineIcons } from '@expo/vector-icons';

import HomeScreen from "../screens/HomeScreen";
import GymScreen from "../screens/GymScreen";
import WallScreen from "../screens/WallScreen";
import ProblemScreen from "../screens/ProblemScreen";
import SelectHoldsScreen from "../screens/SelectHoldsScreen";
import CreateProblemScreen from "../screens/CreateProblemScreen";
import UserSettingScreen from "../screens/UserSettingsScreen";
import CreateGymScreen from "../screens/CreateGymScreen";
import CreateWallScreen from "../screens/CreateWallScreen";
import EditGymScreen from "../screens/EditGymScreen";
import EditWallScreen from "../screens/EditWallScreen";


function Header({ navigation, noSettings }) {
    return (
    <View style={styles.headerBox}>
        <Text onPress={() => navigation.navigate("HomeScreen")} >Flash</Text>
        {
            noSettings === undefined ? (<TouchableOpacity style={{ alignSelf: "flex-end", position: "absolute"}} onPress={() => navigation.navigate('UserSettingScreen')}>
            <SimpleLineIcons name="settings" size={24} color="black" />
        </TouchableOpacity>) : <View/>
        }
    </View>);
}


const screens = {
    HomeScreen: {
        screen: HomeScreen,
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
    CreateWallScreen: {
        screen: CreateWallScreen,
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
    EditGymScreen: {
        screen: EditGymScreen,
        navigationOptions: ({ navigation }) => {
            return {
                headerTitle: () => <Header navigation={navigation} noSettings/>,
                headerLeft: () => null
            }
        }
    },
    EditWallScreen: {
        screen: EditWallScreen,
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