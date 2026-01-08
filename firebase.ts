
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
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
  Timestamp
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
    if (process.env[`VITE_${key}`]) return process.env[`VITE_${key}`];
  }
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    const env = (import.meta as any).env;
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

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

const isFirebaseEnabled = !!firebaseConfig.projectId && firebaseConfig.projectId !== 'undefined';

if (isFirebaseEnabled) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
  } catch (error) {
    console.warn("Firebase Init failed, falling back to LocalStorage:", error);
  }
}

const LOCAL_STORAGE_KEY = 'edupay_v2_db';

interface LocalDB {
  teachers: Teacher[];
  classes: ClassType[];
  attendance: Attendance[];
  payments: Payment[];
  advances: Advance[];
  activityLog: SystemEvent[];
  students: Student[];
  feePayments: FeePayment[];
  exams: Exam[];
  examSubjects: ExamSubject[];
  examPapers: ExamPaper[];
  markEntries: MarkEntry[];
  teacherExamAssignments: TeacherExamAssignment[];
  subjects: Subject[];
}

const getLocalData = (): LocalDB => {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!data) return { teachers: [], classes: [], attendance: [], payments: [], advances: [], activityLog: [], students: [], feePayments: [], exams: [], examSubjects: [], examPapers: [], markEntries: [], teacherExamAssignments: [], subjects: [] };
  try { 
    const parsed = JSON.parse(data);
    return {
      teachers: parsed.teachers || [],
      classes: parsed.classes || [],
      attendance: parsed.attendance || [],
      payments: parsed.payments || [],
      advances: parsed.advances || [],
      activityLog: parsed.activityLog || [],
      students: parsed.students || [],
      feePayments: parsed.feePayments || [],
      exams: parsed.exams || [],
      examSubjects: parsed.examSubjects || [],
      examPapers: parsed.examPapers || [],
      markEntries: parsed.markEntries || [],
      teacherExamAssignments: parsed.teacherExamAssignments || [],
      subjects: parsed.subjects || []
    };
  } catch (e) { return { teachers: [], classes: [], attendance: [], payments: [], advances: [], activityLog: [], students: [], feePayments: [], exams: [], examSubjects: [], examPapers: [], markEntries: [], teacherExamAssignments: [], subjects: [] }; }
};

const saveLocalData = (data: LocalDB) => { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data)); };
const generateId = () => Math.random().toString(36).substr(2, 9);

export const dbService = {
  // --- Exam Management ---
  getExams: async (): Promise<Exam[]> => {
    if (db) {
      const snap = await getDocs(collection(db, 'exams'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Exam));
    }
    return getLocalData().exams;
  },

  getSubjects: async (): Promise<Subject[]> => {
    if (db) {
      const snap = await getDocs(collection(db, 'subjects'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Subject));
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
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as ExamSubject));
    }
    return getLocalData().examSubjects.filter(es => es.examId === examId);
  },

  getExamPapers: async (examId: string): Promise<ExamPaper[]> => {
    if (db) {
      const q = query(collection(db, 'examPapers'), where('examId', '==', examId), orderBy('paperOrder', 'asc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as ExamPaper));
    }
    return getLocalData().examPapers.filter(ep => ep.examId === examId).sort((a,b) => a.paperOrder - b.paperOrder);
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
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as TeacherExamAssignment));
    }
    let res = getLocalData().teacherExamAssignments;
    if (teacherId) res = res.filter(a => a.teacherId === teacherId);
    return res;
  },

  assignTeacherToExam: async (assignment: Omit<TeacherExamAssignment, 'id'>) => {
    if (db) return addDoc(collection(db, 'teacherExamAssignments'), assignment);
    const data = getLocalData();
    data.teacherExamAssignments.push({ id: generateId(), ...assignment });
    saveLocalData(data);
  },

  // --- Mark Entry System ---

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
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as MarkEntry));
    }
    return getLocalData().markEntries.filter(m => 
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
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() } as MarkEntry));
      
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
    return res.filter(m => {
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
      const idx = data.markEntries.findIndex(me => me.id === e.id);
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
      s.enrollments.some(enr => enr.classId === exam.class) && 
      s.medium === exam.medium
    );

    const batch: MarkEntry[] = [];
    
    for (const student of eligibleStudents) {
      for (const paper of papers) {
        const assignment = assignments.find(a => 
          a.examId === examId && 
          a.paperId === paper.id && 
          a.medium === student.medium &&
          a.class === exam.class
        );

        const entry: MarkEntry = {
          id: db ? doc(collection(db, 'markEntries')).id : generateId(),
          examId,
          subjectId: paper.subjectId,
          paperId: paper.id,
          studentId: student.id,
          studentName: student.name,
          studentSeatNo: student.seatNumber,
          class: exam.class,
          division: student.division || 'A',
          medium: student.medium,
          maxMarks: paper.maxMarks,
          obtainedMarks: null,
          isAbsent: false,
          remarks: '',
          teacherId: assignment?.teacherId || 'UNASSIGNED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
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

  // --- Core Services ---
  checkAppUpdates: async (): Promise<AppConfig | null> => {
    if (!db) return null;
    try {
      const docRef = doc(db, 'system_config', 'mobile_app');
      const snap = await getDoc(docRef);
      if (snap.exists()) return snap.data() as AppConfig;
    } catch (e) {}
    return null;
  },

  getTeachers: async (): Promise<Teacher[]> => {
    if (db) {
      const snapshot = await getDocs(collection(db, 'teachers'));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Teacher));
    }
    return getLocalData().teachers;
  },

  getClasses: async (): Promise<ClassType[]> => {
    if (db) {
      const snapshot = await getDocs(collection(db, 'classes'));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ClassType));
    }
    return getLocalData().classes;
  },

  getStudents: async (): Promise<Student[]> => {
    if (db) {
      const snapshot = await getDocs(collection(db, 'students'));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Student));
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
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Advance));
    }
    const data = getLocalData();
    let res = data.advances;
    if (teacherId) res = res.filter(a => a.teacherId === teacherId);
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
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
    }
    return [...getLocalData().payments].sort((a, b) => new Date(b.datePaid).getTime() - new Date(a.datePaid).getTime());
  },

  getFeePayments: async (): Promise<FeePayment[]> => {
    if (db) {
      const snapshot = await getDocs(collection(db, 'feePayments'));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FeePayment));
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
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SystemEvent));
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
      const idx = data.teachers.findIndex(t => t.id === teacherId);
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
      data.classes = data.classes.filter(c => c.id !== id);
      saveLocalData(data);
    }
  },

  getAttendance: async (teacherId?: string, classId?: string) => {
    if (db) {
      let q = query(collection(db, 'attendance'), orderBy('date', 'desc'));
      if (teacherId && classId) q = query(collection(db, 'attendance'), where('teacherId', '==', teacherId), where('classId', '==', classId), orderBy('date', 'desc'));
      else if (teacherId) q = query(collection(db, 'attendance'), where('teacherId', '==', teacherId), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Attendance));
    }
    const data = getLocalData();
    let res = data.attendance;
    if (teacherId) res = res.filter(a => a.teacherId === teacherId);
    if (classId) res = res.filter(a => a.classId === classId);
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
    const idx = data.attendance.findIndex(a => a.teacherId === teacherId && a.classId === classId && a.date === date);
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
      const att = data.attendance.find(a => a.id === attendanceId);
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
    data.advances.filter(a => a.teacherId === teacherId && a.remainingAmount > 0).forEach(adv => {
      if (remainingToDeduct <= 0) return;
      const deduct = Math.min(adv.remainingAmount, remainingToDeduct);
      adv.remainingAmount -= deduct;
      remainingToDeduct -= deduct;
    });
    let runningDeductionPool = totalAdvanceDeduction;
    for (const req of paymentRequests) {
      const pending = data.attendance.filter(a => a.teacherId === teacherId && a.classId === req.classId && a.status === AttendanceStatus.VERIFIED).slice(0, req.lectureCount);
      const paymentId = generateId();
      const deduction = Math.min(req.amount, runningDeductionPool);
      runningDeductionPool -= deduction;
      data.payments.push({ id: paymentId, teacherId, classId: req.classId, amount: req.amount, advanceDeduction: deduction, netDisbursement: req.amount - deduction, lectureCount: req.lectureCount, datePaid: new Date().toISOString(), startDateCovered: pending[0].date, endDateCovered: pending[pending.length-1].date });
      pending.forEach(p => { p.status = AttendanceStatus.PAID; p.paymentId = paymentId; });
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
    const classResults = await Promise.all([
      dbService.addClass({ name: 'JEE Advanced - English', batchSize: 28 }),
      dbService.addClass({ name: 'JEE Advanced - Semi-English', batchSize: 30 })
    ]);
    await dbService.addStudent({
      name: 'AAMENA BEGUM SHAIKH ANWAR',
      seatNumber: 'U2026001',
      medium: 'English',
      division: 'A',
      phone: '0000000000',
      enrollments: [{ classId: classResults[0].id, totalFee: 30000, enrolledAt: '2025-01-01' }]
    });
    const teacher = await dbService.addTeacher({ name: 'Tony Stark', phone: '9000011111', assignments: [{ classId: classResults[0].id, subject: 'Quantum Mechanics', rate: 150000, activeFrom: '2025-01-01' }] });
    
    const exam = await dbService.addExam({
      examName: 'Midterm 2025',
      examType: 'Midterm',
      academicYear: '2025',
      startDate: '2025-06-01',
      endDate: '2025-06-15',
      class: classResults[0].id,
      division: 'A',
      medium: 'English',
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const paper = await dbService.addExamPaper({
      examId: exam.id,
      subjectId: 'QM-101',
      paperName: 'Theory',
      maxMarks: 100,
      weightage: 100,
      paperOrder: 1
    });

    await dbService.assignTeacherToExam({
      teacherId: teacher.id,
      examId: exam.id,
      subjectId: 'QM-101',
      paperId: paper!.id,
      class: classResults[0].id,
      division: 'A',
      medium: 'English',
      assignedAt: new Date().toISOString()
    });

    await dbService.initializeMarkEntries(exam.id);
  }
};
