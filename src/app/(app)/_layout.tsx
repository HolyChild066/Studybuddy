import { Tabs } from 'expo-router';

import { TabBar } from '@/components/tab-bar';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: '#F7F8FC' } }}
      tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="buddy" options={{ title: 'Buddy' }} />
      <Tabs.Screen name="chats" options={{ title: 'Chat' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
