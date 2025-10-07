import { useEffect, useState, type ReactNode } from 'react';
import { db } from '../store/db';
import seed from './seed.json';

async function bootstrap() {
  const count = await db.students.count();
  if (count > 0) return;

  await db.transaction(
    'rw',
    db.students,
    db.classes,
    db.templates,
    db.fitnessTestItems,
    db.fitnessTests,
    db.lessonPackages,
    db.payments,
    db.benchmarks,
    db.rankMoves,
    db.warriorNodes,
    db.gameDrills,
    async () => {
      await db.students.bulkPut(seed.students);
      await db.classes.bulkPut(seed.classes);
      if (seed.templates) await db.templates.bulkPut(seed.templates);
      if (seed.fitnessTestItems) await db.fitnessTestItems.bulkPut(seed.fitnessTestItems);
      if (seed.fitnessTests) await db.fitnessTests.bulkPut(seed.fitnessTests);
      if (seed.lessonPackages) await db.lessonPackages.bulkPut(seed.lessonPackages);
      if (seed.payments) await db.payments.bulkPut(seed.payments);
      if (seed.benchmarks) await db.benchmarks.bulkPut(seed.benchmarks);
      if (seed.rankMoves) await db.rankMoves.bulkPut(seed.rankMoves);
      if (seed.warriorNodes) await db.warriorNodes.bulkPut(seed.warriorNodes);
      if (seed.gameDrills) await db.gameDrills.bulkPut(seed.gameDrills);
    },
  );
}

export function SeedInitializer({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    bootstrap()
      .catch((error) => {
        console.error('Seed bootstrap failed', error);
      })
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        正在载入本地数据...
      </div>
    );
  }

  return <>{children}</>;
}
