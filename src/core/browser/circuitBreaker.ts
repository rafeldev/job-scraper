interface BreakerState {
  failures: number;
  openedAt?: number;
}

export class CircuitBreaker {
  private readonly state = new Map<string, BreakerState>();

  constructor(
    private readonly failureThreshold = 3,
    private readonly resetTimeoutMs = 15 * 60 * 1000
  ) {}

  canExecute(key: string): boolean {
    const current = this.state.get(key);
    if (!current?.openedAt) {
      return true;
    }
    const elapsed = Date.now() - current.openedAt;
    if (elapsed > this.resetTimeoutMs) {
      this.state.set(key, { failures: 0 });
      return true;
    }
    return false;
  }

  recordSuccess(key: string): void {
    this.state.set(key, { failures: 0 });
  }

  recordFailure(key: string): void {
    const current = this.state.get(key) ?? { failures: 0 };
    const failures = current.failures + 1;
    this.state.set(
      key,
      failures >= this.failureThreshold
        ? { failures, openedAt: Date.now() }
        : { failures }
    );
  }
}
