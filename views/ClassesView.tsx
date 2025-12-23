
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, BookOpen } from 'lucide-react';
import { ClassType } from '../types';
import { dbService } from '../firebase';

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

  const handleDelete = async (id: string) => {
    if (confirm("Delete this class?")) {
      await dbService.deleteClass(id);
      loadData();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">Classes & Batches</h2>
          <p className="text-slate-500 font-medium">Define course names and payment milestones</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-md transition-all"
        >
          <Plus className="w-5 h-5" />
          Create Class
        </button>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-in zoom-in-95 duration-200">
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Class Name</label>
              <input 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none font-bold" 
                placeholder="Physics XII - Batch A"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Batch Size (Lectures)</label>
              <input 
                type="number"
                value={formData.batchSize}
                onChange={e => setFormData({ ...formData, batchSize: Number(e.target.value) })}
                className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all">Save Class</button>
              <button type="button" onClick={() => setShowAdd(false)} className="bg-slate-100 text-slate-600 px-4 py-3 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.length === 0 ? (
          <div className="col-span-full py-24 text-center text-slate-400 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-10" />
            <h3 className="text-lg font-black uppercase tracking-widest text-slate-300">No classes defined</h3>
          </div>
        ) : (
          classes.map(cls => (
            <div key={cls.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-md transition-all group relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                  <BookOpen className="w-7 h-7" />
                </div>
                <button 
                  onClick={() => handleDelete(cls.id)}
                  className="text-slate-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tighter">{cls.name}</h3>
              <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 w-fit">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cycle:</span>
                <span className="text-sm font-black text-indigo-600">{cls.batchSize} Lectures</span>
              </div>
              <p className="mt-4 text-[10px] font-bold text-slate-400 leading-relaxed italic">Rates are defined per teacher in the Management tab.</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ClassesView;
