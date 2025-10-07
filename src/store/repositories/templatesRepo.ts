import { db } from '../db';
import type { TrainingTemplate } from '../../types';

export const templatesRepo = {
  async upsert(template: TrainingTemplate) {
    await db.templates.put(template);
  },
  async list() {
    return db.templates.toArray();
  },
  async get(id: string) {
    return db.templates.get(id);
  },
  async remove(id: string) {
    await db.templates.delete(id);
  },
};
