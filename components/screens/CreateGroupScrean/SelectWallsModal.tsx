import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import BasicModal from "@/components/general/modals/BasicModal";
import { TextInput } from "react-native";
import { Wall } from "@/DAL/entities/wall";
import { ThemedText } from "@/components/general/ThemedText";
import PreviewItem from "@/components/general/PreviewItem";
import ParallaxScrollView from "@/components/general/ParallaxScrollView";
import ThemedView from "@/components/general/ThemedView";
import { useDal } from "@/DAL/DALService";
import BasicButton from "@/components/general/Buttom";

const SelectWallModal: React.FC<React.ComponentProps<typeof BasicModal> & {
    onSelect: (id: string) => void;
    onRemove?: (id: string) => void;
    selectedWalls: string[];
}> = ({ onSelect, onRemove, selectedWalls, ...props }) => {
    const dal = useDal();
    const [filterWallName, setFilterWallName] = useState<string>('');
    const [filterGymName, setFilterGymName] = useState<string>(''); const [name, setName] = useState<string>('');
    return (
        <BasicModal {...props} style={[{ height: "70%", overflow: "hidden", borderRadius: 8 }, props.style]}>
            <ParallaxScrollView
                headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
                headerImage={
                    <ThemedView style={styles.header}>
                        <TextInput placeholder="Wall's name" value={filterWallName} onChangeText={setFilterWallName} style={styles.searchTextInput} />
                        <ThemedText type='title'>@</ThemedText>
                        <TextInput placeholder="Gym's name" value={filterGymName} onChangeText={setFilterGymName} style={styles.searchTextInput} />
                    </ThemedView>
                }>
                {
                    dal.walls.List({ isPublic: true, gym: filterGymName, name: filterWallName })
                        .map(wall =>
                            <TouchableOpacity
                                key={wall.id}
                                onPress={() => { onSelect(wall.id) }}
                            >
                                <PreviewItem
                                    image={wall.image}
                                    title={`${wall.name}@${wall.gym}`}
                                    subTitle={wall.angle && `${wall.angle}°` || undefined}
                                    style={{ height: 70 }}
                                />
                                {
                                    selectedWalls.includes(wall.id) &&
                                    <TouchableOpacity
                                        onPress={() => onRemove?.(wall.id)}
                                        style={{ position: "absolute", height: 70, width: "100%", backgroundColor: "black", opacity: 0.5, borderRadius: 8 }} />

                                }
                            </TouchableOpacity>

                        )
                }
                <View style={{ height: 60 }} />

            </ParallaxScrollView>
            <View style={{ width: "100%", opacity: 0.6, backgroundColor: "black", position: "absolute", bottom: 0 }}>
                <BasicButton text="Submit"
                    color="green"
                    onPress={props.closeModal}
                    style={{ alignSelf: "center", margin: 10 }} />
            </View>

        </BasicModal>
    );
};

export default SelectWallModal;

const styles = StyleSheet.create({
    searchTextInput: {
        width: "40%",
        height: 40,
        padding: 10,
        margin: 5,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: "black"
    },
    header: {
        alignItems: 'center',
        backgroundColor: 'transparent',
        flexDirection: "row"
    },
})