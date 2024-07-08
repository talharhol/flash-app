import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import BasicModal from "@/components/general/modals/BasicModal";
import { TextInput } from "react-native";
import { Wall } from "@/DAL/wall";
import { ThemedText } from "@/components/general/ThemedText";
import PreviewItem from "@/components/general/PreviewItem";
import ParallaxScrollView from "@/components/general/ParallaxScrollView";
import ThemedView from "@/components/general/ThemedView";
import { useDal } from "@/DAL/DALService";

const SelectWallModal: React.FC<React.ComponentProps<typeof BasicModal> & {
    onSelect: (id: string) => void;
    selectedWalls: Wall[];
}> = ({ onSelect, selectedWalls, ...props }) => {
    const dal = useDal();
    const [filterWallName, setFilterWallName] = useState<string>('');
    const [filterGymName, setFilterGymName] = useState<string>(''); const [name, setName] = useState<string>('');

    return (
        <BasicModal {...props} style={[{height: "70%", overflow: "hidden", borderRadius: 8}, props.style]}>
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
                dal.getWalls({isPublic: true, gym: filterGymName, name: filterWallName}).map(wall =>
                    <TouchableOpacity
                        key={wall.id}
                        onPress={() => {onSelect(wall.id); props.closeModal()}}
                    >
                        <PreviewItem
                            image={wall.image}
                            title={`${wall.name}@${wall.gym}`}
                            subTitle={wall.angle && `${wall.angle}°` || undefined}
                            style={{height: 70}}
                        />
                        {
                            selectedWalls.includes(wall) &&
                        <TouchableOpacity style={{position: "absolute", height: 70, width: "100%", backgroundColor: "black", opacity: 0.5, borderRadius: 8}}/>

                        }
                    </TouchableOpacity>

                )
            }
        </ParallaxScrollView>
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