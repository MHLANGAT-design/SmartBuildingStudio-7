// src/modules/DaliProgrammingStudio/Commands/DaliCommandTimeout.ts

export class DaliCommandTimeout extends Error {
  constructor(message: string = 'Command timed out') {
    super(message);
    this.name = 'DaliCommandTimeout';
  }
}

export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new DaliCommandTimeout(`Timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then(res => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch(err => {
        clearTimeout(timer);
        reject(err);
      });
  });
}