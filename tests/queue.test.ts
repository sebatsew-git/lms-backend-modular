/**
 * Tests asynchronous queue execution and job history. Verifies successful jobs and captured failures.
 */

import { describe, it, expect } from 'vitest';
import { queue, enqueue, queueStats } from '../src/jobs/queue';

describe('in-process job queue', () => {
  it('runs enqueued jobs and records them in history', async () => {
    let ran = false;

    enqueue('test:noop', async () => {
      ran = true;
    });

    await queue.onIdle();

    expect(ran).toBe(true);
    expect(queueStats().recent.some((entry) => entry.name === 'test:noop' && entry.ok)).toBe(true);
  });

  it('captures failures without throwing to the caller', async () => {
    enqueue('test:boom', async () => {
      throw new Error('expected failure');
    });

    await queue.onIdle();

    const failure = queueStats().recent.find((entry) => entry.name === 'test:boom');
    expect(failure?.ok).toBe(false);
    expect(failure?.error).toBe('expected failure');
  });
});
