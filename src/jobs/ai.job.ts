/**
 * Queues AI feedback and quiz-generation work outside the request path. Notifies users when background AI tasks complete.
 */

import { enqueue } from './queue';
import { generateAiFeedback, generateAiQuiz } from '../ai/ai.service';
import { notifyAiFeedbackReady } from '../notifications/notifications.service';

/**
 * Heavy Gemini work is queued so the request returns immediately; the client polls
 * `GET /ai/feedback/:submissionId` for the persisted result.
 */
export const enqueueAiFeedback = (submissionId: string, userId: string) =>
  enqueue('ai:feedback', async () => {
    const feedback = await generateAiFeedback(submissionId, userId);

    if (feedback.status === 'COMPLETED' && feedback.summary) {
      await notifyAiFeedbackReady(submissionId, feedback.summary);
    }
  });

export const enqueueAiQuizGeneration = (
  quizId: string,
  userId: string,
  topic: string,
  questionCount: number,
) =>
  enqueue('ai:quiz', async () => {
    await generateAiQuiz(quizId, userId, topic, questionCount);
  });
