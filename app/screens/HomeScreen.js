import React, { Component } from 'react';
import { Text, View } from 'react-native';
import HomeCategoriesTabs from '../routers/HomeCategoriesTabs';

function Home({ navigation }) {
    return (
        <View style={{height: "100%", width: "100%", }}>
            <HomeCategoriesTabs navigation={navigation} />
        </View>
    );
}

export default Home;