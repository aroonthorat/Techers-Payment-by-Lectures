
import { useState, useEffect, useMemo } from 'react';
import { dbService } from '../firebase';
import { MarkEntry, ClassPerformanceMetrics, Exam } from '../types';

export const useClassPerformance = (examId: string, classId: string) => {
  const [entries, setEntries] = useState<MarkEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!examId) return;
    setLoading(true);
    dbService.getMarkEntriesWithFilters({ examId, classIds: [classId] })
      .then(setEntries)
      .finally(() => setLoading(false));
  }, [examId, classId]);

  const metrics = useMemo<ClassPerformanceMetrics | null>(() => {
    if (entries.length === 0) return null;

    const scores = entries.filter(e => e.obtainedMarks !== null).map(e => (e.obtainedMarks || 0) / e.maxMarks * 100);
    const avg = scores.reduce((s, c) => s + c, 0) / (scores.length || 1);
    
    const distribution: Record<string, number> = {
      '0-20%': 0, '21-40%': 0, '41-60%': 0, '61-80%': 0, '81-100%': 0
    };

    scores.forEach(s => {
      if (s <= 20) distribution['0-20%']++;
      else if (s <= 40) distribution['21-40%']++;
      else if (s <= 60) distribution['41-60%']++;
      else if (s <= 80) distribution['61-80%']++;
      else distribution['81-100%']++;
    });

    const passCount = scores.filter(s => s >= 40).length;
    const highest = entries.reduce((prev, curr) => (curr.obtainedMarks || 0) > (prev.obtainedMarks || 0) ? curr : prev, entries[0]);

    return {
      examId,
      classId,
      averageMarks: Number(avg.toFixed(2)),
      highestScore: (highest.obtainedMarks || 0),
      highestStudent: highest.studentName,
      lowestScore: Math.min(...scores),
      passRate: Number(((passCount / entries.length) * 100).toFixed(1)),
      failRate: Number(((1 - passCount / entries.length) * 100).toFixed(1)),
      difficultyIndex: avg < 40 ? 'Hard' : avg > 75 ? 'Easy' : 'Moderate',
      distribution
    };
  }, [entries, examId, classId]);

  return { metrics, loading, entries };
};
