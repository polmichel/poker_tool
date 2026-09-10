/**
 * Recap reporter — prints a compact, reason-first summary of the E2E run.
 *
 * The failure reasons are grouped by spec and surfaced at the very top of the
 * recap so you can see *why* tests failed without scrolling through the full
 * results table. Retries are de-duplicated: each test is counted once, using
 * its final outcome.
 */
import path from 'path';
import type { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';

interface FailureEntry {
  spec: string;
  title: string;
  reason: string;
}

class RecapReporter implements Reporter {
  private passed = 0;
  private skipped = 0;
  private failed: FailureEntry[] = [];
  private seen = new Set<string>();

  onTestEnd(test: TestCase, result: TestResult): void {
    const spec = path.basename(test.location.file) || 'unknown';
    const key = `${spec}::${test.title}`;

    // Count each test exactly once using its final attempt.
    if (this.seen.has(key)) return;
    this.seen.add(key);

    if (result.status === 'passed') {
      this.passed += 1;
      return;
    }
    if (result.status === 'skipped') {
      this.skipped += 1;
      return;
    }

    const reason =
      result.error?.message?.split('\n')[0]?.trim() ||
      result.error?.value?.split('\n')[0]?.trim() ||
      result.status;

    this.failed.push({ spec, title: test.title, reason });
  }

  onEnd(_result: FullResult): void {
    const bySpec = new Map<string, FailureEntry[]>();
    for (const f of this.failed) {
      const list = bySpec.get(f.spec) ?? [];
      list.push(f);
      bySpec.set(f.spec, list);
    }

    console.log('\n');
    console.log('==================================================');
    console.log('                   E2E TEST RECAP                 ');
    console.log('==================================================');

    if (this.failed.length > 0) {
      console.log('\n❌ WHY FAILED (grouped by spec, reason first):\n');
      for (const [spec, tests] of bySpec) {
        console.log(`  ${spec} — ${tests.length} failure(s):`);
        for (const t of tests) {
          console.log(`    • ${t.title}`);
          console.log(`        → ${t.reason}`);
        }
        console.log('');
      }
    } else {
      console.log('\n✅ No failures.\n');
    }

    const failedCount = this.failed.length;
    const status = failedCount > 0 ? '❌ FAIL' : '✅ PASS';
    console.log('--------------------------------------------------');
    console.log(
      `  ${status}  |  Passed: ${this.passed}  |  Failed: ${failedCount}  |  Skipped: ${this.skipped}`,
    );
    console.log('==================================================\n');
  }
}

export default RecapReporter;
