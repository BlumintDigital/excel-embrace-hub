export interface QueuedOp {
  id?: number;
  createdAt: number;
  table: string;
  op: "insert" | "update" | "delete";
  payload: Record<string, unknown>;
  filter?: Record<string, unknown>;
  queryKeys: string[][];
}

const STORAGE_KEY = "blumint_offline_queue";
let nextId = Date.now();

function readQueue(): QueuedOp[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeQueue(ops: QueuedOp[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ops));
}

export const db = {
  queue: {
    async add(op: Omit<QueuedOp, "id">): Promise<number> {
      const id = nextId++;
      const queue = readQueue();
      queue.push({ ...op, id });
      writeQueue(queue);
      return id;
    },
    async toArray(): Promise<QueuedOp[]> {
      return readQueue();
    },
    async delete(id: number): Promise<void> {
      writeQueue(readQueue().filter((o) => o.id !== id));
    },
    async count(): Promise<number> {
      return readQueue().length;
    },
    async clear(): Promise<void> {
      writeQueue([]);
    },
  },
};
