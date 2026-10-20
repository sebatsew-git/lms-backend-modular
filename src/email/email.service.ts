import { transporter } from '../common/config/mailer';
import { env } from '../common/config/env';
import { prisma } from '../database/prisma';
import { EmailStatus } from '@prisma/client';
import {
  welcomeTemplate,
  submissionReceiptTemplate,
  gradePublishedTemplate,
  notificationTemplate,
  aiFeedbackReadyTemplate,
} from './email.templates';
import type { SendEmailOptions, SendEmailResult } from './email.types';

/**
 * Non-blocking email dispatch.
 * Every attempt is persisted to `EmailLog`; failures are logged, never thrown.
 */
export const sendEmail = async ({ to, subject, html, text }: SendEmailOptions): Promise<SendEmailResult> => {
  try {
    await transporter.sendMail({ from: env.MAIL_FROM, to, subject, html, text });

    const log = await prisma.emailLog.create({
      data: { to, subject, status: EmailStatus.SENT },
    });

    return { delivered: true, logId: log.id, status: EmailStatus.SENT };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown email error';
    console.error('📧 Email send failed:', message);

    let logId: string | undefined;
    try {
      const log = await prisma.emailLog.create({
        data: { to, subject, status: EmailStatus.FAILED, error: message },
      });
      logId = log.id;
    } catch (logErr) {
      console.error('📧 Could not persist EmailLog:', logErr);
    }

    return { delivered: false, logId, status: EmailStatus.FAILED, error: message };
  }
};

export const sendWelcomeEmail = (to: string, name: string, token: string) => {
  const url = `${env.APP_URL}/api/v1/auth/verify-email?token=${token}`;
  return sendEmail({
    to,
    subject: 'Welcome to LMS — Verify your email',
    html: welcomeTemplate(name, url),
  });
};

export const sendSubmissionReceipt = (
  to: string,
  studentName: string,
  assignment: string,
  course: string,
) =>
  sendEmail({
    to,
    subject: `Submission received: ${assignment}`,
    html: submissionReceiptTemplate(studentName, assignment, course),
  });

export const sendGradeNotification = (
  to: string,
  studentName: string,
  assignment: string,
  grade: number,
) =>
  sendEmail({
    to,
    subject: `Your grade for ${assignment}`,
    html: gradePublishedTemplate(studentName, assignment, grade),
  });

export const sendNotificationEmail = (to: string, name: string, title: string, message: string) =>
  sendEmail({
    to,
    subject: title,
    html: notificationTemplate(name, title, message),
  });

export const sendAiFeedbackEmail = (
  to: string,
  studentName: string,
  assignment: string,
  summary: string,
) =>
  sendEmail({
    to,
    subject: `AI feedback ready: ${assignment}`,
    html: aiFeedbackReadyTemplate(studentName, assignment, summary),
  });

export const listEmailLogs = (limit = 50) =>
  prisma.emailLog.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
