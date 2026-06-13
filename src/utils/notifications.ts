import { Platform, Alert } from 'react-native';

export async function registerForPushNotificationsAsync() {
  console.log('Push notifications are disabled in Expo Go for Android on SDK 56. Please use a development build.');
  return null;
}

export async function scheduleEventNotification(event: any) {
  // Mocked out to prevent crashes in Expo Go
  return;
}

export async function syncUpcomingNotifications(events: any[]) {
  // Mocked out to prevent crashes in Expo Go
  return;
}
