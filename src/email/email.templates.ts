const shell = (body: string) => `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:auto;padding:24px;color:#0f172a;">
    ${body}
    <p style="color:#64748b;font-size:12px;margin-top:24px;">
      LMS Platform — you are receiving this because you have an account on our platform.
    </p>
  </div>
`;

const button = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;">${label}</a>`;

export const welcomeTemplate = (name: string, verifyUrl: string) =>
  shell(`
    <h1 style="color:#2563eb;margin:0 0 12px;">Welcome to LMS, ${name}!</h1>
    <p>Your account has been created. Please verify your email address to unlock your dashboard.</p>
    <p style="margin:20px 0;">${button(verifyUrl, 'Verify Email')}</p>
    <p style="color:#64748b;font-size:13px;">If the button does not work, copy this link:<br/>${verifyUrl}</p>
    <p style="color:#64748b;font-size:12px;">If you didn't sign up, you can safely ignore this email.</p>
  `);

export const submissionReceiptTemplate = (
  studentName: string,
  assignmentTitle: string,
  courseTitle: string,
) =>
  shell(`
    <h2 style="margin:0 0 12px;">Submission Received ✅</h2>
    <p>Hi ${studentName},</p>
    <p>We received your submission for <strong>${assignmentTitle}</strong> in <strong>${courseTitle}</strong>.</p>
    <p>Your instructor will grade it soon. AI feedback may also be generated automatically.</p>
  `);

export const gradePublishedTemplate = (
  studentName: string,
  assignmentTitle: string,
  grade: number,
) =>
  shell(`
    <h2 style="margin:0 0 12px;">Grade Published 🎓</h2>
    <p>Hi ${studentName},</p>
    <p>Your grade for <strong>${assignmentTitle}</strong> is: <strong>${grade}</strong></p>
  `);

export const notificationTemplate = (name: string, title: string, message: string) =>
  shell(`
    <h2 style="margin:0 0 12px;">${title}</h2>
    <p>Hi ${name},</p>
    <p>${message}</p>
  `);

export const aiFeedbackReadyTemplate = (
  studentName: string,
  assignmentTitle: string,
  summary: string,
) =>
  shell(`
    <h2 style="margin:0 0 12px;">AI feedback is ready 🤖</h2>
    <p>Hi ${studentName},</p>
    <p>Automatic feedback for <strong>${assignmentTitle}</strong> has been generated:</p>
    <blockquote style="border-left:3px solid #2563eb;margin:16px 0;padding:8px 16px;color:#334155;">
      ${summary}
    </blockquote>
    <p>Open your dashboard to read the full breakdown.</p>
  `);
