import Dexie, { Table } from "dexie";

export interface QueuedOp {
  id?: number;
  createdAt: number;
  table: string;
  op: "insert" | "update" | "delete";
  payload: Record<string, unknown>;
  filter?: Record<string, unknown>;
  queryKeys: string[][];
}

class BlumintDB extends Dexie {
  queue!: Table<QueuedOp, number>;
  constructor() {
    super("blumint_offline");
    this.version(1).stores({ queue: "++id, createdAt" });
  }
}

export const db = new BlumintDB();
