import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

/** Minimal file-backed JSON store. Good enough for MVP; swap for
 * Postgres/Prisma later without changing the call sites below. */
export class JsonStore<T> {
  private data: T;
  constructor(
    private filePath: string,
    defaultValue: T,
  ) {
    mkdirSync(dirname(filePath), { recursive: true });
    if (existsSync(filePath)) {
      this.data = JSON.parse(readFileSync(filePath, 'utf-8')) as T;
    } else {
      this.data = defaultValue;
      this.persist();
    }
  }

  read(): T {
    return this.data;
  }

  write(mutator: (data: T) => T): T {
    this.data = mutator(this.data);
    this.persist();
    return this.data;
  }

  private persist(): void {
    writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
  }
}
