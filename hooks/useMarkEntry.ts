
import { useState, useEffect, useCallback, useRef } from 'react';
import { MarkEntry } from '../types';
import { dbService } from '../firebase';

export const useMarkEntry = (filters: { examId: string, paperId: string, teacherId: string }) => {
  const [entries, setEntries] = useState<MarkEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const debounceTimer = useRef<Record<string, any>>({});

  const fetchEntries = useCallback(async () => {
    if (!filters.examId || !filters.paperId) return;
    setLoading(true);
    try {
      // Find the specific paper to get subjectId (required for query)
      const papers = await dbService.getExamPapers(filters.examId);
      const paper = papers.find(p => p.id === filters.paperId);
      
      if (paper) {
        const data = await dbService.getMarkEntries({
          examId: filters.examId,
          subjectId: paper.subjectId,
          paperId: filters.paperId,
          teacherId: filters.teacherId
        });
        setEntries(data.sort((a, b) => a.studentSeatNo.localeCompare(b.studentSeatNo)));
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const updateEntryLocally = (id: string, data: Partial<MarkEntry>) => {
    setEntries(prev => prev.map(entry => {
      if (entry.id === id) {
        const updated = { ...entry, ...data, updatedAt: new Date().toISOString() };
        
        // Validation logic
        if (updated.isAbsent) {
          updated.obtainedMarks = 0;
          updated.remarks = "ABSENT";
        }

        // Debounced sync to Firestore
        if (debounceTimer.current[id]) clearTimeout(debounceTimer.current[id]);
        debounceTimer.current[id] = setTimeout(async () => {
          setSyncing(true);
          try {
            await dbService.saveMarkEntries([updated]);
          } finally {
            setSyncing(false);
          }
        }, 1000);

        return updated;
      }
      return entry;
    }));
  };

  const bulkSave = async () => {
    setSyncing(true);
    try {
      await dbService.saveMarkEntries(entries);
    } finally {
      setSyncing(false);
    }
  };

  return { entries, loading, syncing, updateEntryLocally, bulkSave, refresh: fetchEntries };
};
