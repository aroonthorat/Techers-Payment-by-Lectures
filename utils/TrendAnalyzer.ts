
import { MarkEntry, StudentPerformanceTrend, Exam } from '../types';

export const TrendAnalyzer = {
  calculateVelocity: (history: { percentage: number }[]): number => {
    if (history.length < 2) return 0;
    const first = history[0].percentage;
    const last = history[history.length - 1].percentage;
    return Number(((last - first) / history.length).toFixed(2));
  },

  detectTrend: (velocity: number): 'improving' | 'stable' | 'declining' => {
    if (velocity > 1.5) return 'improving';
    if (velocity < -1.5) return 'declining';
    return 'stable';
  },

  analyzeStudent: (
    studentId: string, 
    entries: MarkEntry[], 
    exams: Exam[], 
    subjects: { id: string, name: string }[]
  ): StudentPerformanceTrend => {
    const studentEntries = entries.filter(e => e.studentId === studentId);
    
    // Sort entries by exam date
    const history = studentEntries
      .map(e => {
        const exam = exams.find(ex => ex.id === e.examId);
        return {
          examId: e.examId,
          examName: exam?.examName || 'Unknown',
          date: exam?.startDate || '2000-01-01',
          percentage: (e.obtainedMarks || 0) / e.maxMarks * 100,
          subjectId: e.subjectId,
          grade: '' // Optional enrichment
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const velocity = TrendAnalyzer.calculateVelocity(history);
    const trend = TrendAnalyzer.detectTrend(velocity);
    
    // Detect strengths/weaknesses
    const subjectAvgs: Record<string, { sum: number, count: number }> = {};
    studentEntries.forEach(e => {
      if (!subjectAvgs[e.subjectId]) subjectAvgs[e.subjectId] = { sum: 0, count: 0 };
      subjectAvgs[e.subjectId].sum += (e.obtainedMarks || 0) / e.maxMarks * 100;
      subjectAvgs[e.subjectId].count++;
    });

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    Object.entries(subjectAvgs).forEach(([subId, data]) => {
      const avg = data.sum / data.count;
      const subName = subjects.find(s => s.id === subId)?.name || subId;
      if (avg >= 80) strengths.push(subName);
      if (avg <= 40) weaknesses.push(subName);
    });

    return {
      studentId,
      averagePercentage: Number((history.reduce((s, h) => s + h.percentage, 0) / (history.length || 1)).toFixed(2)),
      velocity,
      trend,
      history,
      strengths,
      weaknesses
    };
  }
};
