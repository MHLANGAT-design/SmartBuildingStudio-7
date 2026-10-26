import { DaliDocument } from "@/modules/DaliDesigner/Document/DaliDocument";

export class DaliHistory {
  private past: DaliDocument[] = [];
  private future: DaliDocument[] = [];

  push(doc: DaliDocument): void {
    this.past.push(structuredClone(doc));
    this.future = [];
    if (this.past.length > 100) this.past.shift();
  }

  undo(current: DaliDocument): DaliDocument | null {
    const prev = this.past.pop();
    if (!prev) return null;
    this.future.push(structuredClone(current));
    return prev;
  }

  redo(current: DaliDocument): DaliDocument | null {
    const next = this.future.pop();
    if (!next) return null;
    this.past.push(structuredClone(current));
    return next;
  }

  clear(): void {
    this.past = [];
    this.future = [];
  }
}