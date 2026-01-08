
import { useState, useCallback, useMemo } from 'react';
import { dbService } from '../firebase';
import { MarkEntry, ExamExportFilters, ExportedMarkEntry, ExamAnalytics, Teacher } from '../types';

export const useExamExport = () => {
  const [entries, setEntries] = useState<ExportedMarkEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const calculateGrade = (percentage: number) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  };

  const fetchFilteredData = useCallback(async (filters: ExamExportFilters, teachers: Teacher[]) => {
    setLoading(true);
    try {
      const data = await dbService.getMarkEntriesWithFilters(filters);
      const enriched: ExportedMarkEntry[] = data.map(m => {
        const percentage = m.maxMarks > 0 ? ((m.obtainedMarks || 0) / m.maxMarks) * 100 : 0;
        return {
          ...m,
          percentage: Number(percentage.toFixed(2)),
          grade: calculateGrade(percentage),
          teacherName: teachers.find(t => t.id === m.teacherId)?.name || 'Unknown'
        };
      });
      setEntries(enriched);
    } catch (err) {
      console.error("Export fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const analytics = useMemo<ExamAnalytics>(() => {
    if (entries.length === 0) {
      return { totalStudents: 0, averageMarks: 0, highestMarks: 0, lowestMarks: 0, passCount: 0, failCount: 0, absentCount: 0, gradeDistribution: {} };
    }

    const marks = entries.filter(e => e.obtainedMarks !== null).map(e => e.obtainedMarks as number);
    const absentCount = entries.filter(e => e.isAbsent).length;
    const totalMarks = marks.reduce((s, m) => s + m, 0);
    const average = marks.length > 0 ? totalMarks / marks.length : 0;
    
    const grades: Record<string, number> = {};
    let pass = 0, fail = 0;

    entries.forEach(e => {
      if (e.isAbsent) return;
      grades[e.grade] = (grades[e.grade] || 0) + 1;
      if (e.percentage >= 40) pass++;
      else fail++;
    });

    const highest = entries.reduce((prev, current) => 
      (current.obtainedMarks || 0) > (prev.obtainedMarks || 0) ? current : prev
    , entries[0]);

    return {
      totalStudents: entries.length,
      averageMarks: Number(average.toFixed(2)),
      highestMarks: highest.obtainedMarks || 0,
      highestStudent: highest.studentName,
      lowestMarks: Math.min(...marks, 0),
      passCount: pass,
      failCount: fail,
      absentCount,
      gradeDistribution: grades
    };
  }, [entries]);

  return { entries, loading, fetchFilteredData, analytics };
};
