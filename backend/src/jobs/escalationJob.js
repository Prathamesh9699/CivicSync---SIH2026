import cron from 'node-cron';
import { escalationService } from '../services/escalationService.js';
import { env } from '../config/env.js';

export const startEscalationJob = () => {
  // Run every 5 minutes in production; every 1 minute in development/test mode
  const cronSchedule = env.SLA_TEST_MODE ? '*/1 * * * *' : '*/5 * * * *';

  cron.schedule(cronSchedule, async () => {
    console.log('[SLA Escalation Engine] Running periodic deadline evaluation check...');
    const result = await escalationService.checkAndEscalateComplaints();
    if (result.escalatedCount > 0 || result.warningCount > 0) {
      console.log(`[SLA Escalation Engine] Evaluated ${result.evaluatedTotal} complaints: ${result.escalatedCount} escalated to CRITICAL, ${result.warningCount} warnings dispatched.`);
    }
  });

  console.log(`[SLA Escalation Engine] Cron scheduler initialized (${cronSchedule})`);
};
