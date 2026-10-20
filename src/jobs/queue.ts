/**
 * Implements the in-process asynchronous job queue. Tracks pending work and recent job outcomes for application monitoring.
 */

type JobFn = () => Promise<void>;

interface QueuedJob {
  name: string;
  fn: JobFn;
  enqueuedAt: Date;
}

/**
 * Minimal in-process FIFO queue with bounded concurrency.
 *
 * Deliberately dependency-free: swap `enqueue` for BullMQ / SQS / Cloud Tasks in
 * production without touching the call sites (jobs/*.job.ts).
 */
class InMemoryQueue {
  private readonly pending: QueuedJob[] = [];
  private active = 0;
  private readonly history: { name: string; ok: boolean; finishedAt: Date; error?: string }[] = [];

  constructor(private readonly concurrency = 3, private readonly historyLimit = 100) {}

  enqueue(name: string, fn: JobFn): void {
    this.pending.push({ name, fn, enqueuedAt: new Date() });
    void this.drain();
  }

  private async drain(): Promise<void> {
    if (this.active >= this.concurrency) return;

    const job = this.pending.shift();
    if (!job) return;

    this.active += 1;
    try {
      await job.fn();
      this.record(job.name, true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown job error';
      console.error(`🧵 Job "${job.name}" failed:`, message);
      this.record(job.name, false, message);
    } finally {
      this.active -= 1;
      void this.drain();
    }
  }

  private record(name: string, ok: boolean, error?: string): void {
    this.history.unshift({ name, ok, finishedAt: new Date(), error });
    if (this.history.length > this.historyLimit) this.history.pop();
  }

  stats() {
    return {
      pending: this.pending.length,
      active: this.active,
      concurrency: this.concurrency,
      recent: this.history.slice(0, 20),
    };
  }

  /** Test helper: resolves once the queue is fully idle. */
  async onIdle(): Promise<void> {
    while (this.active > 0 || this.pending.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
}

export const queue = new InMemoryQueue(3);

export const enqueue = (name: string, fn: JobFn) => queue.enqueue(name, fn);
export const queueStats = () => queue.stats();
