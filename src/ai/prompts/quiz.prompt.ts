export interface QuizPromptContext {
  courseTitle: string;
  quizTitle: string;
  topic: string;
  count: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export const buildQuizPrompt = (ctx: QuizPromptContext) => {
  const difficulty = ctx.difficulty ?? 'medium';

  return `You are an instructional designer writing a multiple-choice quiz.

Course: ${ctx.courseTitle}
Quiz: ${ctx.quizTitle}
Topic: ${ctx.topic}
Difficulty: ${difficulty}
Number of questions: ${ctx.count}

Requirements:
- Exactly ${ctx.count} questions.
- Each question has exactly 4 plausible options.
- Exactly one option is correct; the distractors must be plausible but clearly wrong to an expert.
- Provide a one-sentence explanation for the correct answer.

Return ONLY valid JSON, no markdown fences, matching this shape:
{
  "questions": [
    {
      "prompt": "question text",
      "options": ["option A", "option B", "option C", "option D"],
      "correctIndex": 0,
      "explanation": "why this is correct",
      "points": 1
    }
  ]
}`;
};

export interface SummaryPromptContext {
  text: string;
  maxBullets: number;
}

export const buildSummaryPrompt = (ctx: SummaryPromptContext) => `
Summarise the following course material for a student.

Return ONLY valid JSON, no markdown fences, matching this shape:
{
  "summary": "2-3 sentence overview",
  "bullets": ["key takeaway", "key takeaway"],
  "keywords": ["term", "term"]
}

Produce at most ${ctx.maxBullets} bullets.

Material:
"""
${ctx.text}
"""
`;
