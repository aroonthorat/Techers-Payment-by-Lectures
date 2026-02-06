
import { initializeApp, getApps, FirebaseApp, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  Firestore,
  setDoc,
  Timestamp,
  enableIndexedDbPersistence
} from "firebase/firestore";
import {
  Teacher,
  ClassType,
  Attendance,
  AttendanceStatus,
  TeacherAssignment,
  SystemEvent,
  EventType,
  Payment,
  Advance,
  Student,
  FeePayment,
  AppConfig,
  Exam,
  ExamSubject,
  ExamPaper,
  TeacherExamAssignment,
  MarkEntry,
  Subject,
  ExamExportFilters
} from './types';

const getEnv = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[key]) return process.env[key];
    if (process.env[`NEXT_PUBLIC_${key}`]) return process.env[`NEXT_PUBLIC_${key}`];
    if (process.env[`VITE_${key}`]) return process.env[`VITE_${key}`];
  }
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    const env = import.meta.env;
    if (env[key]) return env[key];
    if (env[`VITE_${key}`]) return env[`VITE_${key}`];
  }
  return undefined;
};

const firebaseConfig = {
  apiKey: getEnv('FIREBASE_API_KEY'),
  authDomain: getEnv('FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('FIREBASE_APP_ID')
};

let app: FirebaseApp;
let db: Firestore | null = null;

const isFirebaseEnabled = !!firebaseConfig.projectId && firebaseConfig.projectId !== 'undefined' && firebaseConfig.apiKey;

if (isFirebaseEnabled) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);

    try {
      enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn("Persistence failed: Multiple tabs open");
        } else if (err.code === 'unimplemented') {
          console.warn("Persistence is not available in this browser");
        }
      });
    } catch (e) { }

  } catch (error) {
    console.error("Firebase Initialization Error:", error);
  }
}

const LOCAL_STORAGE_KEY = 'edupay_v2_db';

const getLocalData = () => {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  const empty = { teachers: [], classes: [], attendance: [], payments: [], advances: [], activityLog: [], students: [], feePayments: [], exams: [], examSubjects: [], examPapers: [], markEntries: [], teacherExamAssignments: [], subjects: [] };
  if (!data) return empty;
  try { return { ...empty, ...JSON.parse(data) }; } catch (e) { return empty; }
};

const saveLocalData = (data: any) => { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data)); };
const generateId = () => Math.random().toString(36).substr(2, 9);

export const dbService = {
  isOnline: () => !!db,

  migrateToCloud: async () => {
    if (!db) throw new Error("Connect Firebase first to migrate.");
    const local = getLocalData();
    const collections = Object.keys(local);

    for (const col of collections) {
      const items = local[col];
      for (const item of items) {
        const { id, ...data } = item;
        await setDoc(doc(db, col, id || generateId()), data);
      }
    }
  },

  getExams: async (): Promise<Exam[]> => {
    if (db) {
      const snap = await getDocs(collection(db, 'exams'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() as any } as Exam));
    }
    return getLocalData().exams;
  },

  getSubjects: async (): Promise<Subject[]> => {
    if (db) {
      const snap = await getDocs(collection(db, 'subjects'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() as any } as Subject));
    }
    return getLocalData().subjects;
  },

  addExam: async (exam: Omit<Exam, 'id'>) => {
    if (db) {
      const docRef = await addDoc(collection(db, 'exams'), exam);
      return { id: docRef.id, ...exam };
    }
    const data = getLocalData();
    const newExam = { id: generateId(), ...exam };
    data.exams.push(newExam);
    saveLocalData(data);
    return newExam;
  },

  getExamSubjects: async (examId: string): Promise<ExamSubject[]> => {
    if (db) {
      const q = query(collection(db, 'examSubjects'), where('examId', '==', examId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() as any } as ExamSubject));
    }
    return getLocalData().examSubjects.filter((es: any) => es.examId === examId);
  },

  getExamPapers: async (examId: string): Promise<ExamPaper[]> => {
    if (db) {
      const q = query(collection(db, 'examPapers'), where('examId', '==', examId), orderBy('paperOrder', 'asc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() as any } as ExamPaper));
    }
    return getLocalData().examPapers.filter((ep: any) => ep.examId === examId).sort((a: any, b: any) => a.paperOrder - b.paperOrder);
  },

  addExamPaper: async (paper: Omit<ExamPaper, 'id'>) => {
    if (db) return addDoc(collection(db, 'examPapers'), paper);
    const data = getLocalData();
    const newPaper = { id: generateId(), ...paper };
    data.examPapers.push(newPaper);
    saveLocalData(data);
    return newPaper;
  },

  getTeacherExamAssignments: async (teacherId?: string): Promise<TeacherExamAssignment[]> => {
    if (db) {
      let q = collection(db, 'teacherExamAssignments') as any;
      if (teacherId) q = query(q, where('teacherId', '==', teacherId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() as any } as TeacherExamAssignment));
    }
    let res = getLocalData().teacherExamAssignments;
    if (teacherId) res = res.filter((a: any) => a.teacherId === teacherId);
    return res;
  },

  assignTeacherToExam: async (assignment: Omit<TeacherExamAssignment, 'id'>) => {
    if (db) return addDoc(collection(db, 'teacherExamAssignments'), assignment);
    const data = getLocalData();
    data.teacherExamAssignments.push({ id: generateId(), ...assignment });
    saveLocalData(data);
  },

  getMarkEntries: async (filters: { examId: string, subjectId: string, paperId: string, teacherId?: string }) => {
    if (db) {
      let q = query(
        collection(db, 'markEntries'),
        where('examId', '==', filters.examId),
        where('subjectId', '==', filters.subjectId),
        where('paperId', '==', filters.paperId)
      );
      if (filters.teacherId) q = query(q, where('teacherId', '==', filters.teacherId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() as any } as MarkEntry));
    }
    return getLocalData().markEntries.filter((m: any) =>
      m.examId === filters.examId &&
      m.subjectId === filters.subjectId &&
      m.paperId === filters.paperId &&
      (!filters.teacherId || m.teacherId === filters.teacherId)
    );
  },

  getMarkEntriesWithFilters: async (f: ExamExportFilters): Promise<MarkEntry[]> => {
    if (db) {
      let q = collection(db, 'markEntries') as any;
      if (f.examId) q = query(q, where('examId', '==', f.examId));
      const snap = await getDocs(q);
      let data = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as MarkEntry));
      return data.filter(m => {
        if (f.classIds && !f.classIds.includes(m.class)) return false;
        if (f.divisions && !f.divisions.includes(m.division)) return false;
        if (f.mediums && !f.mediums.includes(m.medium)) return false;
        if (f.subjectIds && !f.subjectIds.includes(m.subjectId)) return false;
        if (f.paperIds && !f.paperIds.includes(m.paperId)) return false;
        if (f.teacherId && m.teacherId !== f.teacherId) return false;
        if (f.isAbsent !== undefined && m.isAbsent !== f.isAbsent) return false;
        return true;
      });
    }
    let res = getLocalData().markEntries;
    return res.filter((m: any) => {
      if (f.examId && m.examId !== f.examId) return false;
      if (f.classIds && !f.classIds.includes(m.class)) return false;
      if (f.divisions && !f.divisions.includes(m.division)) return false;
      if (f.mediums && !f.mediums.includes(m.medium)) return false;
      if (f.subjectIds && !f.subjectIds.includes(m.subjectId)) return false;
      if (f.paperIds && !f.paperIds.includes(m.paperId)) return false;
      if (f.teacherId && m.teacherId !== f.teacherId) return false;
      if (f.isAbsent !== undefined && m.isAbsent !== f.isAbsent) return false;
      return true;
    });
  },

  saveMarkEntries: async (entries: MarkEntry[]) => {
    if (db) {
      const batch = writeBatch(db);
      entries.forEach(e => {
        const ref = doc(db!, 'markEntries', e.id);
        batch.set(ref, { ...e, updatedAt: new Date().toISOString() }, { merge: true });
      });
      await batch.commit();
      return;
    }
    const data = getLocalData();
    entries.forEach(e => {
      const idx = data.markEntries.findIndex((me: any) => me.id === e.id);
      if (idx !== -1) data.markEntries[idx] = { ...e, updatedAt: new Date().toISOString() };
      else data.markEntries.push(e);
    });
    saveLocalData(data);
  },

  initializeMarkEntries: async (examId: string) => {
    const exams = await dbService.getExams();
    const exam = exams.find(e => e.id === examId);
    if (!exam) return;
    const [students, papers, assignments] = await Promise.all([
      dbService.getStudents(),
      dbService.getExamPapers(examId),
      dbService.getTeacherExamAssignments()
    ]);
    const eligibleStudents = students.filter(s =>
      s.enrollments.some(enr => enr.classId === exam.class) && s.medium === exam.medium
    );
    const batch: MarkEntry[] = [];
    for (const student of eligibleStudents) {
      for (const paper of papers) {
        const assignment = assignments.find(a =>
          a.examId === examId && a.paperId === paper.id && a.medium === student.medium && a.class === exam.class
        );
        const entry: MarkEntry = {
          id: db ? doc(collection(db, 'markEntries')).id : generateId(),
          examId, subjectId: paper.subjectId, paperId: paper.id,
          studentId: student.id, studentName: student.name, studentSeatNo: student.seatNumber,
          class: exam.class, division: student.division || 'A', medium: student.medium,
          maxMarks: paper.maxMarks, obtainedMarks: null, isAbsent: false, remarks: '',
          teacherId: assignment?.teacherId || 'UNASSIGNED',
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
        };
        batch.push(entry);
      }
    }
    if (db) {
      const fbBatch = writeBatch(db);
      batch.forEach(e => fbBatch.set(doc(db!, 'markEntries', e.id), e));
      await fbBatch.commit();
    } else {
      const data = getLocalData();
      data.markEntries.push(...batch);
      saveLocalData(data);
    }
  },

  checkAppUpdates: async (): Promise<AppConfig | null> => {
    if (!db) return null;
    try {
      const docRef = doc(db, 'system_config', 'mobile_app');
      const snap = await getDoc(docRef);
      if (snap.exists()) return snap.data() as AppConfig;
    } catch (e) { }
    return null;
  },

  getTeachers: async (): Promise<Teacher[]> => {
    if (db) {
      const snapshot = await getDocs(collection(db, 'teachers'));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() as any } as Teacher));
    }
    return getLocalData().teachers;
  },

  getClasses: async (): Promise<ClassType[]> => {
    if (db) {
      const snapshot = await getDocs(collection(db, 'classes'));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() as any } as ClassType));
    }
    return getLocalData().classes;
  },

  getStudents: async (): Promise<Student[]> => {
    if (db) {
      const snapshot = await getDocs(collection(db, 'students'));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() as any } as Student));
    }
    return getLocalData().students;
  },

  addStudent: async (student: Omit<Student, 'id'>) => {
    if (db) {
      const docRef = await addDoc(collection(db, 'students'), student);
      return { id: docRef.id, ...student };
    }
    const data = getLocalData();
    const newStudent = { id: generateId(), ...student };
    data.students.push(newStudent);
    saveLocalData(data);
    return newStudent;
  },

  getAdvances: async (teacherId?: string): Promise<Advance[]> => {
    if (db) {
      let q = query(collection(db, 'advances'), orderBy('date', 'desc'));
      if (teacherId) q = query(collection(db, 'advances'), where('teacherId', '==', teacherId), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() as any } as Advance));
    }
    const data = getLocalData();
    let res = data.advances;
    if (teacherId) res = res.filter((a: any) => a.teacherId === teacherId);
    return [...res].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  addAdvance: async (teacherId: string, amount: number, notes?: string) => {
    const teachers = await dbService.getTeachers();
    const teacher = teachers.find(t => t.id === teacherId);
    const advanceData = { teacherId, amount, remainingAmount: amount, date: new Date().toISOString(), notes: notes || 'Advance Payment' };
    if (db) await addDoc(collection(db, 'advances'), advanceData);
    else {
      const data = getLocalData();
      data.advances.push({ id: generateId(), ...advanceData });
      saveLocalData(data);
    }
    await dbService.logEvent(EventType.ADVANCE_GRANTED, teacher?.name || '?', `Granted advance of ₹${amount}`, amount);
  },

  getPayments: async (): Promise<Payment[]> => {
    if (db) {
      const q = query(collection(db, 'payments'), orderBy('datePaid', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() as any } as Payment));
    }
    return [...getLocalData().payments].sort((a, b) => new Date(b.datePaid).getTime() - new Date(a.datePaid).getTime());
  },

  getFeePayments: async (): Promise<FeePayment[]> => {
    if (db) {
      const snapshot = await getDocs(collection(db, 'feePayments'));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() as any } as FeePayment));
    }
    return getLocalData().feePayments;
  },

  addFeePayment: async (payment: Omit<FeePayment, 'id'>) => {
    if (db) await addDoc(collection(db, 'feePayments'), payment);
    else {
      const data = getLocalData();
      data.feePayments.push({ id: generateId(), ...payment });
      saveLocalData(data);
    }
  },

  getActivityLog: async (): Promise<SystemEvent[]> => {
    if (db) {
      const q = query(collection(db, 'activityLog'), orderBy('timestamp', 'desc'), limit(100));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() as any } as SystemEvent));
    }
    return [...getLocalData().activityLog].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 100);
  },

  logEvent: async (type: EventType, teacherName: string, description: string, amount?: number) => {
    const event = { type, teacherName, description, amount: amount || null, timestamp: new Date().toISOString() };
    if (db) await addDoc(collection(db, 'activityLog'), event);
    else {
      const data = getLocalData();
      data.activityLog.push({ id: generateId(), ...event as any });
      saveLocalData(data);
    }
  },

  addTeacher: async (teacher: Omit<Teacher, 'id'>) => {
    if (db) {
      const docRef = await addDoc(collection(db, 'teachers'), teacher);
      await dbService.logEvent(EventType.TEACHER_ADD, teacher.name, `Added new teacher: ${teacher.name}`);
      return { id: docRef.id, ...teacher };
    }
    const data = getLocalData();
    const newTeacher = { id: generateId(), ...teacher };
    data.teachers.push(newTeacher);
    saveLocalData(data);
    await dbService.logEvent(EventType.TEACHER_ADD, teacher.name, `Added new teacher: ${teacher.name}`);
    return newTeacher;
  },

  updateTeacherAssignments: async (teacherId: string, assignments: TeacherAssignment[]) => {
    if (db) await updateDoc(doc(db, 'teachers', teacherId), { assignments });
    else {
      const data = getLocalData();
      const idx = data.teachers.findIndex((t: any) => t.id === teacherId);
      if (idx !== -1) data.teachers[idx].assignments = assignments;
      saveLocalData(data);
    }
  },

  addClass: async (cls: Omit<ClassType, 'id'>) => {
    if (db) {
      const docRef = await addDoc(collection(db, 'classes'), cls);
      return { id: docRef.id, ...cls };
    }
    const data = getLocalData();
    const newClass = { id: generateId(), ...cls };
    data.classes.push(newClass);
    saveLocalData(data);
    return newClass;
  },

  deleteClass: async (id: string) => {
    if (db) deleteDoc(doc(db, 'classes', id));
    else {
      const data = getLocalData();
      data.classes = data.classes.filter((c: any) => c.id !== id);
      saveLocalData(data);
    }
  },

  getAttendance: async (teacherId?: string, classId?: string) => {
    if (db) {
      let q = query(collection(db, 'attendance'), orderBy('date', 'desc'));
      if (teacherId && classId) q = query(collection(db, 'attendance'), where('teacherId', '==', teacherId), where('classId', '==', classId), orderBy('date', 'desc'));
      else if (teacherId) q = query(collection(db, 'attendance'), where('teacherId', '==', teacherId), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() as any } as Attendance));
    }
    const data = getLocalData();
    let res = data.attendance;
    if (teacherId) res = res.filter((a: any) => a.teacherId === teacherId);
    if (classId) res = res.filter((a: any) => a.classId === classId);
    return [...res].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  toggleAttendance: async (teacherId: string, classId: string, date: string, asAdmin: boolean = false) => {
    const teachers = await dbService.getTeachers();
    const teacher = teachers.find(t => t.id === teacherId);
    const classes = await dbService.getClasses();
    const cls = classes.find(c => c.id === classId);
    const newStatus = asAdmin ? AttendanceStatus.VERIFIED : AttendanceStatus.SUBMITTED;
    if (db) {
      const q = query(collection(db, 'attendance'), where('teacherId', '==', teacherId), where('classId', '==', classId), where('date', '==', date));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const attendanceDoc = snapshot.docs[0];
        if (!asAdmin && attendanceDoc.data().status !== AttendanceStatus.SUBMITTED) throw new Error("Cannot modify verified records.");
        if (attendanceDoc.data().status === AttendanceStatus.PAID) throw new Error("Paid records are locked.");
        await deleteDoc(doc(db, 'attendance', attendanceDoc.id));
        await dbService.logEvent(EventType.ATTENDANCE_REMOVE, teacher?.name || '?', `Removed attendance for ${cls?.name} on ${date}`);
      } else {
        await addDoc(collection(db, 'attendance'), { teacherId, classId, date, status: newStatus, paymentId: null, markedAt: new Date().toISOString() });
        await dbService.logEvent(EventType.ATTENDANCE_MARK, teacher?.name || '?', `Marked lecture for ${cls?.name} on ${date}`);
      }
      return;
    }
    const data = getLocalData();
    const idx = data.attendance.findIndex((a: any) => a.teacherId === teacherId && a.classId === classId && a.date === date);
    if (idx !== -1) {
      const record = data.attendance[idx];
      if (!asAdmin && record.status !== AttendanceStatus.SUBMITTED) throw new Error("Cannot modify verified records.");
      if (record.status === AttendanceStatus.PAID) throw new Error("Paid records are locked.");
      data.attendance.splice(idx, 1);
    } else {
      data.attendance.push({ id: generateId(), teacherId, classId, date, status: newStatus, paymentId: null, markedAt: new Date().toISOString() });
    }
    saveLocalData(data);
  },

  verifyAttendance: async (attendanceId: string) => {
    if (db) await updateDoc(doc(db, 'attendance', attendanceId), { status: AttendanceStatus.VERIFIED });
    else {
      const data = getLocalData();
      const att = data.attendance.find((a: any) => a.id === attendanceId);
      if (att) { att.status = AttendanceStatus.VERIFIED; saveLocalData(data); }
    }
  },

  processBulkPayment: async (teacherId: string, paymentRequests: { classId: string, lectureCount: number, amount: number }[], totalAdvanceDeduction: number = 0) => {
    const teachers = await dbService.getTeachers();
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return;
    if (db) {
      const batch = writeBatch(db);
      if (totalAdvanceDeduction > 0) {
        const advancesSnapshot = await getDocs(query(collection(db, 'advances'), where('teacherId', '==', teacherId), where('remainingAmount', '>', 0), orderBy('date', 'asc')));
        let remainingToDeduct = totalAdvanceDeduction;
        for (const advDoc of advancesSnapshot.docs) {
          if (remainingToDeduct <= 0) break;
          const advData = advDoc.data() as Advance;
          const deductFromAdv = Math.min(advData.remainingAmount, remainingToDeduct);
          batch.update(advDoc.ref, { remainingAmount: advData.remainingAmount - deductFromAdv });
          remainingToDeduct -= deductFromAdv;
        }
      }
      let runningDeductionPool = totalAdvanceDeduction;
      for (const req of paymentRequests) {
        const q = query(collection(db, 'attendance'), where('teacherId', '==', teacherId), where('classId', '==', req.classId), where('status', '==', AttendanceStatus.VERIFIED), orderBy('date', 'asc'), limit(req.lectureCount));
        const snapshot = await getDocs(q);
        const paymentId = doc(collection(db, 'payments')).id;
        const deduction = Math.min(req.amount, runningDeductionPool);
        runningDeductionPool -= deduction;
        batch.set(doc(db, 'payments', paymentId), { teacherId, classId: req.classId, amount: req.amount, advanceDeduction: deduction, netDisbursement: req.amount - deduction, lectureCount: req.lectureCount, datePaid: new Date().toISOString(), startDateCovered: snapshot.docs[0].data().date, endDateCovered: snapshot.docs[snapshot.docs.length - 1].data().date });
        snapshot.docs.forEach(d => batch.update(d.ref, { status: AttendanceStatus.PAID, paymentId }));
      }
      await batch.commit();
      return;
    }
    const data = getLocalData();
    let remainingToDeduct = totalAdvanceDeduction;
    data.advances.filter((a: any) => a.teacherId === teacherId && a.remainingAmount > 0).forEach((adv: any) => {
      if (remainingToDeduct <= 0) return;
      const deduct = Math.min(adv.remainingAmount, remainingToDeduct);
      adv.remainingAmount -= deduct;
      remainingToDeduct -= deduct;
    });
    let runningDeductionPool = totalAdvanceDeduction;
    for (const req of paymentRequests) {
      const pending = data.attendance.filter((a: any) => a.teacherId === teacherId && a.classId === req.classId && a.status === AttendanceStatus.VERIFIED).slice(0, req.lectureCount);
      const paymentId = generateId();
      const deduction = Math.min(req.amount, runningDeductionPool);
      runningDeductionPool -= deduction;
      data.payments.push({ id: paymentId, teacherId, classId: req.classId, amount: req.amount, advanceDeduction: deduction, netDisbursement: req.amount - deduction, lectureCount: req.lectureCount, datePaid: new Date().toISOString(), startDateCovered: pending[0].date, endDateCovered: pending[pending.length - 1].date });
      pending.forEach((p: any) => { p.status = AttendanceStatus.PAID; p.paymentId = paymentId; });
    }
    saveLocalData(data);
  },

  clearDatabase: async () => {
    if (db) {
      const collections = ['teachers', 'classes', 'attendance', 'payments', 'advances', 'activityLog', 'students', 'feePayments', 'exams', 'examSubjects', 'examPapers', 'markEntries', 'teacherExamAssignments', 'subjects'];
      for (const coll of collections) {
        const snapshot = await getDocs(collection(db, coll));
        const batch = writeBatch(db);
        snapshot.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    }
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  },

  seedDatabase: async () => {
    await dbService.clearDatabase();

    // 1. Create Core Batches
    const c1 = await dbService.addClass({ name: '12th SCIENCE - MH BOARD', batchSize: 28 });
    const c2 = await dbService.addClass({ name: '11th SCIENCE - MH BOARD', batchSize: 30 });
    const c3 = await dbService.addClass({ name: 'NEET REPEATER BATCH', batchSize: 24 });
    const c4 = await dbService.addClass({ name: 'JEE INTENSIVE 2026', batchSize: 32 });

    // 2. Create Faculty Members (Teachers)
    const t1 = await dbService.addTeacher({
      name: 'PROF. KHAN ARSHAD',
      phone: '9822001122',
      assignments: [
        { classId: c1.id, subject: 'Physics', rate: 120000, activeFrom: '2025-01-01' },
        { classId: c2.id, subject: 'Mathematics', rate: 100000, activeFrom: '2025-01-01' }
      ]
    });

    const t2 = await dbService.addTeacher({
      name: 'DR. SNEHA DESHMUKH',
      phone: '9911223344',
      assignments: [
        { classId: c1.id, subject: 'Biology', rate: 85000, activeFrom: '2025-01-01' },
        { classId: c3.id, subject: 'Botany', rate: 90000, activeFrom: '2025-01-01' }
      ]
    });

    const t3 = await dbService.addTeacher({
      name: 'PROF. AMIT VERMA',
      phone: '9001122334',
      assignments: [
        { classId: c4.id, subject: 'Chemistry', rate: 110000, activeFrom: '2025-01-01' },
        { classId: c1.id, subject: 'Organic Chemistry', rate: 95000, activeFrom: '2025-01-01' }
      ]
    });

    // 3. Create Student Directory
    const s1 = await dbService.addStudent({
      name: 'SHAIKH ARMAAN JAVEED', seatNumber: 'U2026001', medium: 'English', division: 'A', phone: '9000100010',
      enrollments: [{ classId: c1.id, totalFee: 45000, enrolledAt: '2025-01-05' }]
    });

    const s2 = await dbService.addStudent({
      name: 'SYED AMAN ALI', seatNumber: 'U2026002', medium: 'Urdu', division: 'B', phone: '9000100011',
      enrollments: [{ classId: c2.id, totalFee: 32000, enrolledAt: '2025-01-07' }]
    });

    const s3 = await dbService.addStudent({
      name: 'KULKARNI ADITYA RAVI', seatNumber: 'U2026003', medium: 'Semi-English', division: 'A', phone: '9000100012',
      enrollments: [{ classId: c3.id, totalFee: 55000, enrolledAt: '2025-01-10' }]
    });

    const s4 = await dbService.addStudent({
      name: 'PATEL RIYA SURESH', seatNumber: 'U2026004', medium: 'English', division: 'C', phone: '9000100013',
      enrollments: [{ classId: c4.id, totalFee: 65000, enrolledAt: '2025-01-12' }]
    });

    const s5 = await dbService.addStudent({
      name: 'GAIKWAD OMKAR VINAYAK', seatNumber: 'U2026005', medium: 'Semi-English', division: 'A', phone: '9000100014',
      enrollments: [{ classId: c1.id, totalFee: 42000, enrolledAt: '2025-01-15' }]
    });

    // 4. Record Initial Fee Collections
    await dbService.addFeePayment({ studentId: s1.id, amount: 20000, date: '2025-01-15', notes: 'First Installment - Cheque' });
    await dbService.addFeePayment({ studentId: s2.id, amount: 5000, date: '2025-01-20', notes: 'Registration Fee' });
    await dbService.addFeePayment({ studentId: s4.id, amount: 35000, date: '2025-01-22', notes: 'Online Transfer' });

    // 5. Generate Sample Attendance (Historical & Pending)
    const today = new Date();
    const dates = [
      new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      today.toISOString().split('T')[0]
    ];

    // Verified & Ready for Payment
    await dbService.toggleAttendance(t1.id, c1.id, dates[0], true);
    await dbService.toggleAttendance(t2.id, c1.id, dates[0], true);

    // Submitted & Pending Review
    await dbService.toggleAttendance(t1.id, c2.id, dates[1], false);
    await dbService.toggleAttendance(t3.id, c4.id, dates[1], false);
    await dbService.toggleAttendance(t2.id, c3.id, dates[2], false);

    // 6. Log System Events
    await dbService.logEvent(EventType.TEACHER_ADD, 'SYSTEM', 'Initialized Comprehensive Trial Database');

    // 7. Academic Assessment Structure
    const exam = await dbService.addExam({
      examName: 'UNIT EVALUATION - I', examType: 'Unit Test', academicYear: '2025-26',
      startDate: '2025-07-01', endDate: '2025-07-07', class: c1.id,
      division: 'A', medium: 'English', status: 'Active',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    });

    const paper = await dbService.addExamPaper({
      examId: exam.id, subjectId: 'PHY-101', paperName: 'Basic Mechanics', maxMarks: 50, weightage: 100, paperOrder: 1
    });

    await dbService.assignTeacherToExam({
      teacherId: t1.id, examId: exam.id, subjectId: 'PHY-101', paperId: paper!.id,
      class: c1.id, division: 'A', medium: 'English', assignedAt: new Date().toISOString()
    });

    // Initialize individual marksheets for the exam
    await dbService.initializeMarkEntries(exam.id);
  }
};
