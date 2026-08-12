import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  console.log('Failed to import expo-notifications', e);
}

if (Notifications) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (e) {
    console.log('Failed to set notification handler:', e);
  }
}

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<any | false>(false);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => token && setExpoPushToken(token));

    if (Notifications) {
      try {
        notificationListener.current = Notifications.addNotificationReceivedListener((notification: any) => {
          setNotification(notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener((response: any) => {
          console.log('Notification tapped:', response);
          // Handle navigation here if needed
        });
      } catch (e) {
        console.log('Failed to add notification listeners:', e);
      }
    }

    return () => {
      if (Notifications) {
        try {
          if (notificationListener.current) {
            Notifications.removeNotificationSubscription(notificationListener.current);
          }
          if (responseListener.current) {
            Notifications.removeNotificationSubscription(responseListener.current);
          }
        } catch (e) {
          console.log('Failed to clean up notification listeners:', e);
        }
      }
    };
  }, []);

  return { expoPushToken, notification };
}

async function registerForPushNotificationsAsync() {
  let token;
  
  if (!Notifications) {
    console.log('Push notifications are not available.');
    return token;
  }

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
      
      // Get projectId from Constants
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: projectId || "lexarchitect-local",
      })).data;
      console.log('Push token:', token);
    } else {
      console.log('Must use physical device for Push Notifications');
    }
  } catch (error) {
    console.log('Push notifications are not available:', error);
  }

  return token;
}
