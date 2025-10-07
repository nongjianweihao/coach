import { db } from '../db';
import type { SessionRecord } from '../../types';

export const sessionsRepo = {
  async upsert(record: SessionRecord) {
    await db.sessions.put(record);
  },
  async listByClass(classId: string) {
    return db.sessions.where({ classId }).sortBy('date');
  },
  async recent(limit = 10) {
    return db.sessions.orderBy('date').reverse().limit(limit).toArray();
  },
  async get(id: string) {
    return db.sessions.get(id);
  },
};
