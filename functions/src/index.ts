
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { validateMarks, MarkEntryUpdate } from './validation';
import { getExamDetails, getTeacherAssignment } from './queries';

admin.initializeApp();
const db = admin.firestore();

/**
 * Generates empty marksheets for students assigned to an exam.
 */
export const generateMarkEntries = functions.https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can initialize marks.');
  }

  const { examId, subjectIds } = data;
  const exam = await getExamDetails(db, examId);
  
  // 1. Get eligible students
  const studentSnap = await db.collection('students')
    .where('medium', '==', exam?.medium)
    .get();
  
  const eligibleStudents = studentSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter((s: any) => s.division === exam?.division);

  // 2. Get papers for these subjects
  const paperSnap = await db.collection('examPapers')
    .where('examId', '==', examId)
    .where('subjectId', 'in', subjectIds)
    .get();
  
  const papers = paperSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // 3. Batch generate
  let count = 0;
  let batch = db.batch();

  for (const student of eligibleStudents as any[]) {
    for (const paper of papers as any[]) {
      const entryRef = db.collection('markEntries').doc();
      batch.set(entryRef, {
        examId,
        subjectId: paper.subjectId,
        paperId: paper.id,
        studentId: student.id,
        studentName: student.name,
        studentSeatNo: student.seatNumber,
        class: exam?.class,
        division: exam?.division,
        medium: exam?.medium,
        maxMarks: paper.maxMarks,
        obtainedMarks: null,
        isAbsent: false,
        status: 'draft',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      count++;
      if (count % 450 === 0) {
        await batch.commit();
        batch = db.batch();
      }
    }
  }

  await batch.commit();
  return { success: true, createdCount: count };
});

/**
 * Validates and saves a batch of marks from a teacher.
 */
export const bulkUpdateMarkEntries = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required.');
  
  const { markEntriesToUpdate, examId, teacherId } = data;
  const callerUid = context.auth.uid;

  // Security check: If teacher, must be updating their own entries
  if (context.auth.token.role === 'teacher' && teacherId !== callerUid) {
    throw new functions.https.HttpsError('permission-denied', 'Cannot update marks for another teacher.');
  }

  const batch = db.batch();
  
  for (const entry of markEntriesToUpdate as MarkEntryUpdate[]) {
    const docRef = db.collection('markEntries').doc(entry.id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) continue;
    const existing = docSnap.data();

    // Validate marks against paper maximum
    const validation = validateMarks(entry, existing?.maxMarks);
    if (!validation.valid) {
      throw new functions.https.HttpsError('invalid-argument', `Error in ${existing?.studentName}: ${validation.error}`);
    }

    // Verify teacher is still assigned
    const isAssigned = await getTeacherAssignment(db, teacherId, examId, existing?.paperId);
    if (!isAssigned) {
       throw new functions.https.HttpsError('permission-denied', `Teacher not assigned to ${existing?.studentName}'s paper.`);
    }

    batch.update(docRef, {
      obtainedMarks: entry.obtainedMarks,
      isAbsent: entry.isAbsent,
      remarks: entry.isAbsent ? 'ABSENT' : entry.remarks,
      teacherId,
      status: 'submitted',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: callerUid
    });
  }

  await batch.commit();
  return { success: true, updatedCount: markEntriesToUpdate.length };
});

/**
 * Perform batch grading logic for an entire assessment cycle.
 */
export const calculateAllGrades = functions.https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required.');
  }

  const { examId } = data;
  const entriesSnap = await db.collection('markEntries').where('examId', '==', examId).get();
  
  let batch = db.batch();
  let count = 0;

  entriesSnap.docs.forEach(doc => {
    const entry = doc.data();
    if (entry.obtainedMarks === null) return;

    const percentage = (entry.obtainedMarks / entry.maxMarks) * 100;
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B+';
    else if (percentage >= 60) grade = 'B';
    else if (percentage >= 50) grade = 'C+';
    else if (percentage >= 40) grade = 'C';
    else if (percentage >= 30) grade = 'D';

    batch.update(doc.ref, {
      calculatedGrade: grade,
      calculatedPercentage: Number(percentage.toFixed(2)),
      gradedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    count++;
    if (count % 450 === 0) {
      // commit current batch
    }
  });

  await batch.commit();
  return { success: true, gradedCount: count };
});

/**
 * Aggregates analytical data for dashboard.
 */
export const aggregateStats = functions.https.onCall(async (data) => {
  const { examId } = data;
  const snap = await db.collection('markEntries').where('examId', '==', examId).get();
  
  const entries = snap.docs.map(d => d.data());
  const passCount = entries.filter(e => !e.isAbsent && (e.obtainedMarks / e.maxMarks) >= 0.4).length;
  const failCount = entries.filter(e => !e.isAbsent && (e.obtainedMarks / e.maxMarks) < 0.4).length;

  return {
    totalStudents: snap.size,
    passCount,
    failCount,
    absentCount: entries.filter(e => e.isAbsent).length
  };
});
