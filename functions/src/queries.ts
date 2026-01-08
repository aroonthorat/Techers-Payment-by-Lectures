
import * as admin from 'firebase-admin';

export const getExamDetails = async (db: admin.firestore.Firestore, examId: string) => {
  const snap = await db.collection('exams').doc(examId).get();
  if (!snap.exists) throw new Error("Exam not found");
  return snap.data();
};

export const getEligibleStudents = async (
  db: admin.firestore.Firestore, 
  className: string, 
  division: string, 
  medium: string
) => {
  const snap = await db.collection('students')
    .where('enrollments', 'array-contains', { classId: className }) // Simple check, might need logic for map search
    .where('medium', '==', medium)
    .get();
    
  // Refine for division if it's a top-level field
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getTeacherAssignment = async (
  db: admin.firestore.Firestore,
  teacherId: string,
  examId: string,
  paperId: string
) => {
  const snap = await db.collection('teacherExamAssignments')
    .where('teacherId', '==', teacherId)
    .where('examId', '==', examId)
    .where('paperId', '==', paperId)
    .limit(1)
    .get();
    
  return !snap.empty;
};
