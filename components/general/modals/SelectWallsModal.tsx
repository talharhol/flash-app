import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import BasicModal from "@/components/general/modals/BasicModal";
import { TextInput } from "react-native";
import { ThemedText } from "@/components/general/ThemedText";
import PreviewItem from "@/components/general/PreviewItem";
import ParallaxScrollView from "@/components/general/ParallaxScrollView";
import ThemedView from "@/components/general/ThemedView";
import BasicButton from "@/components/general/Button";
import { IDAL } from "@/DAL/IDAL";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";

const SelectWallModal: React.FC<React.ComponentProps<typeof BasicModal> & {
    dal: IDAL;
    onSelect: (id: string) => void;
    onRemove?: (id: string) => void;
    selectedWalls: string[];
}> = ({ dal, onSelect, onRemove, selectedWalls, ...props }) => {
    const [filterWallName, setFilterWallName] = useState<string>('');
    const [filterGymName, setFilterGymName] = useState<string>(''); const [name, setName] = useState<string>('');
    return (
        <BasicModal {...props}
        backgroundColor="rgba(50, 50, 50, 0.6)"
         style={[{ height: "80%", width: "90%", overflow: "hidden", borderRadius: 12 }, props.style]}>
            <ParallaxScrollView
                headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
                headerImage={
                    <ThemedView style={styles.header}>
                        <View style={styles.searchInputWrapper}>
                            <Ionicons name="search-outline" size={16} color={Colors.backgroundExtraDark} style={{ marginLeft: 8 }} />
                            <TextInput placeholder="Wall name" value={filterWallName} onChangeText={setFilterWallName} style={styles.searchTextInput} />
                        </View>
                        <ThemedText type='title' style={{ marginHorizontal: 4 }}>@</ThemedText>
                        <View style={styles.searchInputWrapper}>
                            <Ionicons name="business-outline" size={16} color={Colors.backgroundExtraDark} style={{ marginLeft: 8 }} />
                            <TextInput placeholder="Gym name" value={filterGymName} onChangeText={setFilterGymName} style={styles.searchTextInput} />
                        </View>
                    </ThemedView>
                }>
                {
                    dal.walls.List({ isPublic: true, latest: true, gym: filterGymName, name: filterWallName })
                        .map(wall =>
                            <TouchableOpacity
                                key={wall.id}
                                onPress={() => { onSelect(wall.id) }}
                            >
                                <PreviewItem
                                    image={wall.image}
                                    title={wall.name}
                                    subTitle={wall.gym}
                                    descriprion={wall.angle ? `${wall.angle}°` : undefined}
                                    style={{ height: 70 }}
                                />
                                {
                                    selectedWalls.includes(wall.id) &&
                                    <TouchableOpacity
                                        onPress={() => onRemove?.(wall.id)}
                                        style={{ position: "absolute", height: 70, width: "100%", backgroundColor: "rgba(46, 125, 50, 0.4)", borderRadius: 8, justifyContent: "center", alignItems: "flex-end", paddingRight: 14 }}>
                                        <Ionicons name="checkmark-circle" size={28} color="white" />
                                    </TouchableOpacity>
                                }
                            </TouchableOpacity>
                        )
                }
                <View style={{ height: 60 }} />

            </ParallaxScrollView>
            <View style={{ width: "100%", backgroundColor: Colors.backgroundDark, position: "absolute", bottom: -1, borderTopWidth: 1, borderTopColor: Colors.backgroundExtraDark }}>
                <BasicButton text="Done"
                    color={Colors.confirm}
                    selected
                    onPress={props.closeModal}
                    style={{ alignSelf: "center", margin: 10, width: "60%" }} />
            </View>

        </BasicModal>
    );
};

export default SelectWallModal;

const styles = StyleSheet.create({
    searchInputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.backgroundLite,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.backgroundExtraDark,
        margin: 4,
        flex: 1,
    },
    searchTextInput: {
        flex: 1,
        height: 40,
        paddingHorizontal: 6,
    },
    header: {
        alignItems: 'center',
        backgroundColor: 'transparent',
        flexDirection: "row",
        paddingHorizontal: 8,
    },
})