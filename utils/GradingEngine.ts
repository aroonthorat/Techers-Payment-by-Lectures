
import { GradeResult } from '../types';

export const GradingEngine = {
  calculateGrade: (obtained: number, max: number): GradeResult => {
    // Corrected: replaced 'this.getFailGrade' with 'GradingEngine.getFailGrade'
    if (max <= 0) return GradingEngine.getFailGrade("Invalid Max Marks");
    const percentage = (obtained / max) * 100;

    if (percentage >= 90) return {
      grade: 'A+', gradePoints: 4.0, isPass: true,
      feedback: "Exceptional mastery of concepts. Consistent high performance.",
      color: "text-emerald-500", bgColor: "bg-emerald-500/10"
    };
    if (percentage >= 80) return {
      grade: 'A', gradePoints: 3.7, isPass: true,
      feedback: "Strong academic performance. Minor areas for refinement.",
      color: "text-emerald-400", bgColor: "bg-emerald-400/10"
    };
    if (percentage >= 70) return {
      grade: 'B+', gradePoints: 3.3, isPass: true,
      feedback: "Above average understanding. Good progress.",
      color: "text-blue-500", bgColor: "bg-blue-500/10"
    };
    if (percentage >= 60) return {
      grade: 'B', gradePoints: 3.0, isPass: true,
      feedback: "Satisfactory performance. Consistent effort needed.",
      color: "text-blue-400", bgColor: "bg-blue-400/10"
    };
    if (percentage >= 50) return {
      grade: 'C+', gradePoints: 2.5, isPass: true,
      feedback: "Average performance. Requires more focus on core topics.",
      color: "text-amber-500", bgColor: "bg-amber-500/10"
    };
    if (percentage >= 40) return {
      grade: 'C', gradePoints: 2.0, isPass: true,
      feedback: "Passing grade. Intensive review recommended.",
      color: "text-amber-400", bgColor: "bg-amber-400/10"
    };
    if (percentage >= 30) return {
      grade: 'D', gradePoints: 1.0, isPass: false,
      feedback: "Needs significant improvement. Remedial support suggested.",
      color: "text-rose-400", bgColor: "bg-rose-400/10"
    };
    
    return {
      grade: 'F', gradePoints: 0.0, isPass: false,
      feedback: "Incomplete mastery. Immediate intervention required.",
      color: "text-rose-600", bgColor: "bg-rose-600/10"
    };
  },

  getFailGrade: (customFeedback?: string): GradeResult => ({
    grade: 'F', gradePoints: 0, isPass: false,
    feedback: customFeedback || "Marks not recorded or invalid.",
    color: "text-rose-600", bgColor: "bg-rose-600/10"
  })
};
