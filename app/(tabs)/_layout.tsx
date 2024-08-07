import { Tabs } from 'expo-router';
import React from 'react';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { TabBarIcon } from '@/components/general/TabBarIcon';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
    backBehavior='history'
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
      }}>

      <Tabs.Screen
        name="index"
        options={{
          title: 'My Walls',
          unmountOnBlur: true,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color}  />
          ),
        }}
      />
      <Tabs.Screen
        name="MyGroupsScreen"
        options={{
          title: 'My Groups',
          unmountOnBlur: true,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'people' : 'people-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="SearchScreen"
        options={{
          title: 'Search',
          unmountOnBlur: true,
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
          unmountOnBlur: true
        }}
      />
      <Tabs.Screen
        name="CreateBolderProblem"
        options={{
          href: null,
          unmountOnBlur: true
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
          unmountOnBlur: true
        }}
      />
      <Tabs.Screen
        name="CreateWall"
        options={{
          href: null,
          unmountOnBlur: true
        }}
      />
      <Tabs.Screen
        name="CreateWallHolds"
        options={{
          href: null,
          unmountOnBlur: true
        }}
      />
      <Tabs.Screen
        name="CreateGroup"
        options={{
          href: null,
          unmountOnBlur: true
        }}
      />
    </Tabs>
  );
}
