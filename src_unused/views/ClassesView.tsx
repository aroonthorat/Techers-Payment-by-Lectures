
import React, { useState, useEffect } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import { ClassType } from '../types';
import { dbService } from '../lib/netlify-client';

const ClassesView: React.FC = () => {
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ name: '', batchSize: 28 });

  const loadData = async () => {
    const data = await dbService.getClasses();
    setClasses(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    await dbService.addClass(formData);
    setFormData({ name: '', batchSize: 28 });
    setShowAdd(false);
    loadData();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold theme-text uppercase tracking-tight">Classes & Batches</h2>
          <p className="theme-text-muted font-medium">Define course names and payment milestones</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="theme-bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:brightness-110 shadow-md transition-all"
        >
          <Plus className="w-5 h-5" />
          Create Class
        </button>
      </div>

      {showAdd && (
        <div className="theme-card p-6 rounded-2xl shadow-sm border animate-in zoom-in-95 duration-200">
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-[10px] font-black theme-text-muted uppercase tracking-widest mb-1 ml-1">Class Name</label>
              <input 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full theme-card rounded-xl p-3 focus:ring-2 focus:ring-[var(--primary)] outline-none font-bold" 
                placeholder="Physics XII - Batch A"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black theme-text-muted uppercase tracking-widest mb-1 ml-1">Batch Size (Lectures)</label>
              <input 
                type="number"
                value={formData.batchSize}
                onChange={e => setFormData({ ...formData, batchSize: Number(e.target.value) })}
                className="w-full theme-card rounded-xl p-3 focus:ring-2 focus:ring-[var(--primary)] outline-none font-bold"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 theme-bg-primary text-white px-4 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:brightness-110 transition-all">Save Class</button>
              <button type="button" onClick={() => setShowAdd(false)} className="bg-[var(--bg-main)] theme-text-muted px-4 py-3 rounded-xl font-bold text-xs hover:brightness-95 transition-all">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.length === 0 ? (
          <div className="col-span-full py-24 text-center theme-text-muted bg-[var(--bg-card)] rounded-[2.5rem] border border-dashed theme-border">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-10" />
            <h3 className="text-lg font-black uppercase tracking-widest theme-text-muted opacity-40">No classes defined</h3>
          </div>
        ) : (
          classes.map(cls => (
            <div key={cls.id} className="theme-card p-8 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-[var(--primary-light)] theme-primary rounded-2xl flex items-center justify-center">
                  <BookOpen className="w-7 h-7" />
                </div>
              </div>
              <h3 className="text-xl font-black theme-text mb-2 uppercase tracking-tighter">{cls.name}</h3>
              <div className="flex items-center gap-2 bg-[var(--bg-main)] px-4 py-2 rounded-xl border theme-border w-fit">
                <span className="text-[10px] font-black theme-text-muted uppercase tracking-widest">Cycle:</span>
                <span className="text-sm font-black theme-primary">{cls.batchSize} Lectures</span>
              </div>
              <p className="mt-4 text-[10px] font-bold theme-text-muted leading-relaxed italic opacity-60">Rates are defined per teacher in the Management tab.</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ClassesView;
