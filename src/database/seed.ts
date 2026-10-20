import { PrismaClient, Role, CourseStatus, QuizStatus } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

const hash = (plain: string) =>
  argon2.hash(plain, { type: argon2.argon2id, memoryCost: 2 ** 16, timeCost: 3, parallelism: 1 });

async function main() {
  console.log('🌱 Seeding database…');

  const password = await hash('Passw0rd!');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@lms.dev' },
    update: {},
    create: {
      email: 'admin@lms.dev',
      password,
      firstName: 'Ada',
      lastName: 'Admin',
      role: Role.ADMIN,
      isVerified: true,
      profile: { create: { bio: 'Platform administrator' } },
    },
  });

  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@lms.dev' },
    update: {},
    create: {
      email: 'instructor@lms.dev',
      password,
      firstName: 'Grace',
      lastName: 'Hopper',
      role: Role.INSTRUCTOR,
      isVerified: true,
      profile: { create: { bio: 'Senior instructor — Computer Science' } },
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@lms.dev' },
    update: {},
    create: {
      email: 'student@lms.dev',
      password,
      firstName: 'Alan',
      lastName: 'Turing',
      role: Role.STUDENT,
      isVerified: true,
      profile: { create: { bio: 'MSc student' } },
    },
  });

  console.log(`👤 Users ready: ${admin.email}, ${instructor.email}, ${student.email}`);

  const courseTitle = 'Introduction to Distributed Systems';
  let course = await prisma.course.findFirst({ where: { title: courseTitle } });

  if (!course) {
    course = await prisma.course.create({
      data: {
        title: courseTitle,
        description:
          'Consensus, replication, fault tolerance and the CAP theorem — with hands-on labs.',
        status: CourseStatus.PUBLISHED,
        instructorId: instructor.id,
        modules: {
          create: [
            {
              title: 'Foundations',
              order: 1,
              lessons: {
                create: [
                  {
                    title: 'What is a distributed system?',
                    content:
                      'Failure models, synchronous vs asynchronous networks, and why partial failure is the defining challenge.',
                    order: 1,
                    duration: 25,
                  },
                  {
                    title: 'Time, clocks and ordering',
                    content:
                      'Lamport clocks, vector clocks and causal ordering in asynchronous systems.',
                    order: 2,
                    duration: 30,
                  },
                ],
              },
            },
            {
              title: 'Consensus',
              order: 2,
              lessons: {
                create: [
                  {
                    title: 'Paxos in plain English',
                    content:
                      'Proposers, acceptors and learners — how a quorum agrees on a single value.',
                    order: 1,
                    duration: 40,
                  },
                  {
                    title: 'Raft: leader election and log replication',
                    content:
                      'Terms, heartbeats, elections and the commit rule that makes Raft understandable.',
                    order: 2,
                    duration: 45,
                  },
                ],
              },
            },
            {
              title: 'Replication',
              order: 3,
              lessons: {
                create: [
                  {
                    title: 'Primary-backup and quorums',
                    content:
                      'Synchronous vs asynchronous replication, read/write quorums and tail latency.',
                    order: 1,
                    duration: 35,
                  },
                ],
              },
            },
          ],
        },
        assignments: {
          create: [
            {
              title: 'Assignment 1 — Raft Implementation',
              description:
                'Implement leader election and log replication for a 5-node Raft cluster and submit a written design note.',
              dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
              maxPoints: 100,
            },
            {
              title: 'Assignment 2 — CAP Case Study',
              description:
                'Analyse a real-world outage through the lens of the CAP theorem and propose mitigations.',
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              maxPoints: 50,
            },
          ],
        },
        quizzes: {
          create: [
            {
              title: 'Consensus Fundamentals',
              description: 'Five questions covering Paxos, Raft and quorum reasoning.',
              status: QuizStatus.PUBLISHED,
              questions: {
                create: [
                  {
                    prompt: 'What is the minimum quorum size in a 5-node cluster?',
                    options: ['2', '3', '4', '5'],
                    correctIndex: 1,
                    explanation: 'A strict majority of 5 is 3 nodes.',
                    points: 2,
                  },
                  {
                    prompt: 'Which protocol uses terms and heartbeats?',
                    options: ['Paxos', 'Raft', '2PC', 'Gossip'],
                    correctIndex: 1,
                    explanation: 'Raft structures time into terms and uses heartbeats for leadership.',
                    points: 2,
                  },
                  {
                    prompt: 'CAP theorem says you must sacrifice which property under a partition?',
                    options: ['Consistency or Availability', 'Durability', 'Atomicity', 'Isolation'],
                    correctIndex: 0,
                    explanation: 'During a network partition you choose C or A.',
                    points: 2,
                  },
                ],
              },
            },
          ],
        },
      },
    });
    console.log(`📘 Course created: ${course.title} (${course.id})`);
  } else {
    console.log(`📘 Course already present: ${course.title}`);
  }

  await prisma.enrollment.upsert({
    where: { studentId_courseId: { studentId: student.id, courseId: course.id } },
    update: {},
    create: { studentId: student.id, courseId: course.id },
  });

  await prisma.notification.create({
    data: {
      userId: student.id,
      type: 'ENROLLMENT',
      title: 'Welcome to the course',
      message: `You are now enrolled in "${course.title}". Start with Module 1 — Foundations.`,
    },
  });

  console.log('✅ Seeding complete.');
  console.log('🔑 Demo password for every seeded user: Passw0rd!');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
