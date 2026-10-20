import { enqueue } from './queue';
import {
  sendWelcomeEmail,
  sendSubmissionReceipt,
  sendGradeNotification,
  sendNotificationEmail,
  sendAiFeedbackEmail,
} from '../email/email.service';

/**
 * Every email is dispatched through the queue so HTTP handlers never block on SMTP.
 * The underlying `sendEmail` already swallows failures, so a job cannot crash the worker.
 */
export const enqueueWelcomeEmail = (to: string, name: string, token: string) =>
  enqueue('email:welcome', async () => {
    await sendWelcomeEmail(to, name, token);
  });

export const enqueueSubmissionReceipt = (
  to: string,
  studentName: string,
  assignment: string,
  course: string,
) =>
  enqueue('email:submission-receipt', async () => {
    await sendSubmissionReceipt(to, studentName, assignment, course);
  });

export const enqueueGradeNotification = (
  to: string,
  studentName: string,
  assignment: string,
  grade: number,
) =>
  enqueue('email:grade', async () => {
    await sendGradeNotification(to, studentName, assignment, grade);
  });

export const enqueueNotificationEmail = (to: string, name: string, title: string, message: string) =>
  enqueue('email:notification', async () => {
    await sendNotificationEmail(to, name, title, message);
  });

export const enqueueAiFeedbackEmail = (
  to: string,
  studentName: string,
  assignment: string,
  summary: string,
) =>
  enqueue('email:ai-feedback', async () => {
    await sendAiFeedbackEmail(to, studentName, assignment, summary);
  });
