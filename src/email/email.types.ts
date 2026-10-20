import { EmailStatus } from '@prisma/client';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  delivered: boolean;
  logId?: string;
  status: EmailStatus;
  error?: string;
}

export type EmailTemplateName =
  | 'welcome'
  | 'submission-receipt'
  | 'grade-published'
  | 'notification'
  | 'ai-feedback-ready';
