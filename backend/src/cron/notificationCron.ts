import cron from 'node-cron';
import db from '../db';
import { sendPushNotification } from '../services/PushService';

export const initCronJobs = () => {
  // Run every day at 08:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('Running daily notification cron job...');

    try {
      // 1. Duruşmalar (Hearings for tomorrow)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const upcomingHearings = await db.prepare(`
        SELECT h.title, h.time, h.userId, c.title as caseTitle
        FROM hearings h
        LEFT JOIN cases c ON h.caseId = c.id
        WHERE h.date = ?
      `).all(tomorrowStr) as any[];

      for (const hearing of upcomingHearings) {
        await sendPushNotification(
          hearing.userId,
          'Yaklaşan Duruşma',
          `Yarın saat ${hearing.time || 'belli değil'} - ${hearing.caseTitle || ''} davasında duruşmanız var: ${hearing.title}`
        );
      }

      // 2. Etkinlikler/Randevular (Events for tomorrow)
      const upcomingEvents = await db.prepare(`
        SELECT title, time, userId
        FROM events
        WHERE date = ?
      `).all(tomorrowStr) as any[];

      for (const event of upcomingEvents) {
        await sendPushNotification(
          event.userId,
          'Yaklaşan Etkinlik',
          `Yarın saat ${event.time || 'belli değil'} - ${event.title}`
        );
      }

      // 3. Görevler (Incomplete tasks up to today)
      const today = new Date().toISOString().split('T')[0];
      const incompleteTasks = await db.prepare(`
        SELECT title, userId
        FROM tasks
        WHERE date <= ? AND completed = 0
      `).all(today) as any[];

      for (const task of incompleteTasks) {
        await sendPushNotification(
          task.userId,
          'Dava Görevi',
          `Tamamlanmayan dava görevi var: ${task.title}`
        );
      }

      // 4. Görev Temizliği (Delete tasks completed > 7 days ago)
      const deletedInfo = await db.prepare(`
        DELETE FROM tasks
        WHERE completed = 1 AND completedAt <= datetime('now', '-7 days')
      `).run();
      if (deletedInfo.changes > 0) {
        console.log(`Deleted ${deletedInfo.changes} old completed tasks.`);
      }

    } catch (error) {
      console.error('Error in daily cron job:', error);
    }
  });

  // Run every 4 hours for high priority tasks
  cron.schedule('0 */4 * * *', async () => {
    console.log('Running high priority tasks notification cron job...');
    try {
      const today = new Date().toISOString().split('T')[0];
      const highPriorityTasks = await db.prepare(`
        SELECT title, userId
        FROM tasks
        WHERE date <= ? AND completed = 0 AND priority = 'high'
      `).all(today) as any[];

      for (const task of highPriorityTasks) {
        await sendPushNotification(
          task.userId,
          'Acil Dava Görevi',
          `Yüksek öncelikli görev bekliyor: ${task.title}`
        );
      }
    } catch (error) {
      console.error('Error in high priority cron job:', error);
    }
  });

  console.log('Cron jobs initialized');
};
