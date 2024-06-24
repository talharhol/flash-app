import { Tabs } from 'expo-router';
import React from 'react';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { TabBarIcon } from '@/components/general/TabBarIcon';
import { walls } from '../debugData';

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
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color}  />
          ),
        }}
      />
      <Tabs.Screen
        name="MyGroupsScreen"
        options={{
          title: 'My Groups',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ViewWall"
        options={{
          href: null
        }}
      />
      <Tabs.Screen
        name="CreateBolderProblem"
        options={{
          href: null
        }}
      />
      <Tabs.Screen
        name="ViewGroupScreen"
        options={{
          href: null
        }}
      />
      <Tabs.Screen
        name="SelectWallScreen"
        options={{
          href: null
        }}
      />
    </Tabs>
  );
}