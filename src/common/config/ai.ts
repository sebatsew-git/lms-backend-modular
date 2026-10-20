/**
 * Configures the Google generative AI client from environment settings. Exports the model used by AI services.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './env';

export const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
});
