import { useState } from 'react';
import type { TemplateBlock, TrainingTemplate } from '../types';
import { generateId } from '../store/repositories/utils';

interface TemplateBuilderProps {
  value: TrainingTemplate;
  onChange: (template: TrainingTemplate) => void;
}

export function TemplateBuilder({ value, onChange }: TemplateBuilderProps) {
  const [draft, setDraft] = useState<TrainingTemplate>(value);

  const emit = (next: TrainingTemplate) => {
    setDraft(next);
    onChange(next);
  };

  const addBlock = () => {
    const block: TemplateBlock = {
      id: generateId(),
      title: '新增模块',
      period: draft.period,
      durationMin: 10,
      notes: '',
    };
    emit({ ...draft, blocks: [...draft.blocks, block] });
  };

  const updateBlock = (id: string, updater: (block: TemplateBlock) => TemplateBlock) => {
    emit({
      ...draft,
      blocks: draft.blocks.map((block) => (block.id === id ? updater(block) : block)),
    });
  };

  const removeBlock = (id: string) => {
    emit({ ...draft, blocks: draft.blocks.filter((block) => block.id !== id) });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {draft.blocks.map((block, index) => (
          <div key={block.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-700">
                {index + 1}.{' '}
                <input
                  className="ml-1 w-48 rounded-md border border-transparent px-2 py-1 text-sm font-semibold text-slate-800 focus:border-brand-400"
                  value={block.title}
                  onChange={(event) =>
                    updateBlock(block.id, (prev) => ({ ...prev, title: event.target.value }))
                  }
                />
              </div>
              <button
                type="button"
                onClick={() => removeBlock(block.id)}
                className="text-xs text-slate-400 hover:text-red-500"
              >
                删除
              </button>
            </div>
            <div className="mt-3 grid gap-2 text-xs text-slate-600">
              <label className="flex items-center gap-2">
                <span className="w-20">周期</span>
                <select
                  className="flex-1 rounded-md border border-slate-200 px-2 py-1"
                  value={block.period}
                  onChange={(event) =>
                    updateBlock(block.id, (prev) => ({ ...prev, period: event.target.value as any }))
                  }
                >
                  <option value="ALL">全部</option>
                  <option value="PREP">准备期</option>
                  <option value="SPEC">专项准备期</option>
                  <option value="COMP">比赛期</option>
                </select>
              </label>
              <label className="flex items-center gap-2">
                <span className="w-20">时长</span>
                <input
                  type="number"
                  min={0}
                  className="flex-1 rounded-md border border-slate-200 px-2 py-1"
                  value={block.durationMin ?? ''}
                  onChange={(event) =>
                    updateBlock(block.id, (prev) => ({
                      ...prev,
                      durationMin: Number(event.target.value),
                    }))
                  }
                />
                <span>min</span>
              </label>
              <label className="flex items-start gap-2">
                <span className="w-20 pt-1">教学要点</span>
                <textarea
                  className="flex-1 rounded-md border border-slate-200 px-2 py-1"
                  rows={3}
                  value={block.notes ?? ''}
                  onChange={(event) =>
                    updateBlock(block.id, (prev) => ({ ...prev, notes: event.target.value }))
                  }
                />
              </label>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addBlock}
        className="w-full rounded-lg border border-dashed border-brand-300 bg-white py-3 text-sm font-semibold text-brand-600 hover:bg-brand-50"
      >
        添加模块
      </button>
    </div>
  );
}
