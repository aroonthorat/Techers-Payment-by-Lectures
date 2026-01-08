
import { useState, useEffect } from 'react';
import { dbService } from '../firebase';
import { TeacherExamAssignment, Exam, ExamPaper } from '../types';

export const useTeacherAssignments = (teacherId: string) => {
  const [assignments, setAssignments] = useState<TeacherExamAssignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [asgs, allExams] = await Promise.all([
          dbService.getTeacherExamAssignments(teacherId),
          dbService.getExams()
        ]);
        
        // Filter exams that have at least one assignment for this teacher
        const assignedExamIds = new Set(asgs.map(a => a.examId));
        const filteredExams = allExams.filter(e => assignedExamIds.has(e.id));
        
        setAssignments(asgs);
        setExams(filteredExams);
      } catch (err) {
        console.error("Failed to load teacher assignments", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [teacherId]);

  return { assignments, exams, loading };
};
