import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import db from '../db';

const expo = new Expo();

export const sendPushNotification = async (userId: number, title: string, body: string, data: any = {}) => {
  try {
    const user = await db.prepare('SELECT pushToken FROM users WHERE id = $1').get(userId) as any;
    
    if (!user || !user.pushToken || !Expo.isExpoPushToken(user.pushToken)) {
      console.log(`User ${userId} does not have a valid push token.`);
      return;
    }

    const messages: ExpoPushMessage[] = [{
      to: user.pushToken,
      sound: 'default',
      title,
      body,
      data,
    }];

    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (let chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending push chunk', error);
      }
    }
    
    console.log(`Push notification sent to user ${userId}:`, title);
  } catch (error) {
    console.error('Failed to send push notification:', error);
  }
};

export const sendPushNotificationToCaseTeam = async (caseId: number, title: string, body: string, excludeUserId?: number) => {
  try {
    const caseObj = await db.prepare('SELECT userId FROM cases WHERE id = $1').get(caseId) as any;
    if (!caseObj) return;

    const userIds = new Set<number>();
    userIds.add(caseObj.userId);

    const collaborators = await db.prepare('SELECT userId FROM caseCollaborators WHERE caseId = $1').all(caseId) as any[];
    for (const c of collaborators) userIds.add(c.userId);

    const shares = await db.prepare('SELECT sharedWithUserId FROM caseShares WHERE caseId = $1').all(caseId) as any[];
    for (const s of shares) userIds.add(s.sharedWithUserId);

    if (excludeUserId) {
      userIds.delete(excludeUserId);
    }

    for (const id of userIds) {
      await sendPushNotification(id, title, body);
    }
  } catch (error) {
    console.error('Failed to notify case team:', error);
  }
};
