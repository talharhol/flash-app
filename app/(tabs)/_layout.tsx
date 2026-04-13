import { Tabs } from 'expo-router';
import React from 'react';

import { Colors } from '@/constants/Colors';
import { TabBarIcon } from '@/components/general/TabBarIcon';

export default function TabLayout() {

  return (
    <Tabs
      backBehavior='history'
      screenOptions={{
        tabBarActiveTintColor: Colors.backgroundExtraLite,
        tabBarInactiveTintColor: Colors.backgroundDark,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.backgroundDeep,
          borderTopColor: Colors.backgroundExtraDark,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Nunito',
          fontWeight: '600',
        },
      }}>

      <Tabs.Screen
        name="index"
        options={{
          title: 'My Walls',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="MyGroupsScreen"
        options={{
          title: 'My Groups',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'people' : 'people-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="SearchScreen"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'search' : 'search-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="SettingsScreen"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'settings' : 'settings-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ViewWall"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="CreateBolderProblem"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="ViewGroupScreen"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="SelectWallScreen"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="CreateWall"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="CreateWallHolds"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="CreateGroup"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
