export interface FeedbackPromptContext {
  courseTitle: string;
  assignmentTitle: string;
  assignmentDescription: string;
  maxPoints: number;
  submissionText: string;
  tone?: 'encouraging' | 'neutral' | 'strict';
  includeScore?: boolean;
}

const TONE_INSTRUCTIONS: Record<string, string> = {
  encouraging:
    'Be warm and motivating. Lead with what the student did well, then frame gaps as next steps.',
  neutral: 'Be factual and balanced. State strengths and weaknesses without emotional framing.',
  strict:
    'Be rigorous and demanding. Hold the work to a high academic standard and call out every weakness.',
};

export const buildFeedbackPrompt = (ctx: FeedbackPromptContext) => {
  const tone = TONE_INSTRUCTIONS[ctx.tone ?? 'encouraging'];

  const scoreField = ctx.includeScore === false ? '' : `\n  "score": <number between 0 and ${ctx.maxPoints}>,`;

  return `You are an experienced teaching assistant grading a student submission.

Course: ${ctx.courseTitle}
Assignment: ${ctx.assignmentTitle}
Instructions: ${ctx.assignmentDescription}
Maximum points: ${ctx.maxPoints}

Feedback style: ${tone}

Student submission:
"""
${ctx.submissionText || '(No written content provided — a file was attached, so assess what can be inferred from the assignment context.)'}
"""

Return ONLY valid JSON matching this exact shape, with no markdown fences and no commentary:
{
  "summary": "2-3 sentence overall assessment",${scoreField}
  "strengths": ["specific strength", "specific strength"],
  "improvements": ["specific, actionable improvement", "specific, actionable improvement"]
}`;
};
