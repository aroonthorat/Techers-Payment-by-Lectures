
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
  setDoc
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
  AppConfig
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
}

const getLocalData = (): LocalDB => {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!data) return { teachers: [], classes: [], attendance: [], payments: [], advances: [], activityLog: [], students: [], feePayments: [] };
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
      feePayments: parsed.feePayments || []
    };
  } catch (e) { return { teachers: [], classes: [], attendance: [], payments: [], advances: [], activityLog: [], students: [], feePayments: [] }; }
};

const saveLocalData = (data: LocalDB) => { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data)); };
const generateId = () => Math.random().toString(36).substr(2, 9);

export const dbService = {
  // Update Checker
  checkAppUpdates: async (): Promise<AppConfig | null> => {
    if (!db) return null;
    try {
      // We look for a collection 'system_config' and doc 'mobile_app'
      const docRef = doc(db, 'system_config', 'mobile_app');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as AppConfig;
      } else {
        // Create default if not exists to make it easier for admin to find
        await setDoc(docRef, {
           latestVersion: '1.0.0',
           downloadUrl: '',
           forceUpdate: false,
           releaseNotes: 'Initial Release'
        });
      }
    } catch (e) {
      console.warn("Update check failed", e);
    }
    return null;
  },

  getTeachers: async (): Promise<Teacher[]> => {
    if (db) {
      try {
        const snapshot = await getDocs(collection(db, 'teachers'));
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Teacher));
      } catch (e) {}
    }
    return getLocalData().teachers;
  },

  getClasses: async (): Promise<ClassType[]> => {
    if (db) {
      try {
        const snapshot = await getDocs(collection(db, 'classes'));
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ClassType));
      } catch (e) {}
    }
    return getLocalData().classes;
  },

  getStudents: async (): Promise<Student[]> => {
    if (db) {
      try {
        const snapshot = await getDocs(collection(db, 'students'));
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Student));
      } catch (e) {}
    }
    return getLocalData().students;
  },

  addStudent: async (student: Omit<Student, 'id'>) => {
    if (db) {
      try {
        const docRef = await addDoc(collection(db, 'students'), student);
        return { id: docRef.id, ...student };
      } catch (e) {}
    }
    const data = getLocalData();
    const newStudent = { id: generateId(), ...student };
    data.students.push(newStudent);
    saveLocalData(data);
    return newStudent;
  },

  updateStudent: async (id: string, student: Partial<Student>) => {
    if (db) {
      try { await updateDoc(doc(db, 'students', id), student); } catch (e) {}
    } else {
      const data = getLocalData();
      const idx = data.students.findIndex(s => s.id === id);
      if (idx !== -1) {
        data.students[idx] = { ...data.students[idx], ...student };
        saveLocalData(data);
      }
    }
  },

  // Bulk Import Logic
  bulkImportStudents: async (payload: { student: Omit<Student, 'id'>, payments: Omit<FeePayment, 'id' | 'studentId'>[] }[]) => {
    if (db) {
      try {
        const batch = writeBatch(db);
        
        for (const item of payload) {
          // Create Student Ref
          const studentRef = doc(collection(db, 'students'));
          batch.set(studentRef, item.student);
          
          // Create Payment Refs linked to Student
          for (const pay of item.payments) {
            const payRef = doc(collection(db, 'feePayments'));
            batch.set(payRef, {
              ...pay,
              studentId: studentRef.id
            });
          }
        }
        await batch.commit();
        return;
      } catch (e) {
        throw e;
      }
    } else {
      const data = getLocalData();
      for (const item of payload) {
        const studentId = generateId();
        data.students.push({ id: studentId, ...item.student });
        
        for (const pay of item.payments) {
          data.feePayments.push({
            id: generateId(),
            studentId: studentId,
            ...pay
          });
        }
      }
      saveLocalData(data);
    }
  },

  getAdvances: async (teacherId?: string): Promise<Advance[]> => {
    if (db) {
      try {
        let q = query(collection(db, 'advances'), orderBy('date', 'desc'));
        if (teacherId) q = query(collection(db, 'advances'), where('teacherId', '==', teacherId), orderBy('date', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Advance));
      } catch (e) {}
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
    if (db) {
      try { await addDoc(collection(db, 'advances'), advanceData); } catch (e) {}
    } else {
      const data = getLocalData();
      data.advances.push({ id: generateId(), ...advanceData });
      saveLocalData(data);
    }
    await dbService.logEvent(EventType.ADVANCE_GRANTED, teacher?.name || '?', `Granted advance of ₹${amount}`, amount);
  },

  getPayments: async (): Promise<Payment[]> => {
    if (db) {
      try {
        const q = query(collection(db, 'payments'), orderBy('datePaid', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
      } catch (e) {}
    }
    return [...getLocalData().payments].sort((a, b) => new Date(b.datePaid).getTime() - new Date(a.datePaid).getTime());
  },

  getFeePayments: async (): Promise<FeePayment[]> => {
    if (db) {
      try {
        const snapshot = await getDocs(collection(db, 'feePayments'));
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FeePayment));
      } catch (e) {}
    }
    return getLocalData().feePayments;
  },

  addFeePayment: async (payment: Omit<FeePayment, 'id'>) => {
    if (db) {
      try {
        await addDoc(collection(db, 'feePayments'), payment);
      } catch (e) {}
    } else {
      const data = getLocalData();
      data.feePayments.push({ id: generateId(), ...payment });
      saveLocalData(data);
    }
  },

  getActivityLog: async (): Promise<SystemEvent[]> => {
    if (db) {
      try {
        const q = query(collection(db, 'activityLog'), orderBy('timestamp', 'desc'), limit(100));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SystemEvent));
      } catch (e) {}
    }
    return [...getLocalData().activityLog].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 100);
  },

  logEvent: async (type: EventType, teacherName: string, description: string, amount?: number) => {
    const event = { type, teacherName, description, amount: amount || null, timestamp: new Date().toISOString() };
    if (db) { try { await addDoc(collection(db, 'activityLog'), event); } catch (e) {} } 
    else {
      const data = getLocalData();
      data.activityLog.push({ id: generateId(), ...event as any });
      saveLocalData(data);
    }
  },

  addTeacher: async (teacher: Omit<Teacher, 'id'>) => {
    if (db) {
      try {
        const docRef = await addDoc(collection(db, 'teachers'), teacher);
        await dbService.logEvent(EventType.TEACHER_ADD, teacher.name, `Added new teacher: ${teacher.name}`);
        return { id: docRef.id, ...teacher };
      } catch (e) {}
    }
    const data = getLocalData();
    const newTeacher = { id: generateId(), ...teacher };
    data.teachers.push(newTeacher);
    saveLocalData(data);
    await dbService.logEvent(EventType.TEACHER_ADD, teacher.name, `Added new teacher: ${teacher.name}`);
    return newTeacher;
  },

  updateTeacherAssignments: async (teacherId: string, assignments: TeacherAssignment[]) => {
    if (db) {
      try { await updateDoc(doc(db, 'teachers', teacherId), { assignments }); } catch (e) {}
    } else {
      const data = getLocalData();
      const idx = data.teachers.findIndex(t => t.id === teacherId);
      if (idx !== -1) data.teachers[idx].assignments = assignments;
      saveLocalData(data);
    }
    const teachers = await dbService.getTeachers();
    const t = teachers.find(item => item.id === teacherId);
    if (t) await dbService.logEvent(EventType.RATE_CHANGE, t.name, `Updated assignments for ${t.name}`);
  },

  addClass: async (cls: Omit<ClassType, 'id'>) => {
    if (db) {
      try {
        const docRef = await addDoc(collection(db, 'classes'), cls);
        return { id: docRef.id, ...cls };
      } catch (e) {}
    }
    const data = getLocalData();
    const newClass = { id: generateId(), ...cls };
    data.classes.push(newClass);
    saveLocalData(data);
    return newClass;
  },

  deleteClass: async (id: string) => {
    if (db) { try { deleteDoc(doc(db, 'classes', id)); } catch (e) {} } 
    else {
      const data = getLocalData();
      data.classes = data.classes.filter(c => c.id !== id);
      saveLocalData(data);
    }
  },

  getAttendance: async (teacherId?: string, classId?: string) => {
    if (db) {
      try {
        let q = query(collection(db, 'attendance'), orderBy('date', 'desc'));
        if (teacherId && classId) {
          q = query(collection(db, 'attendance'), where('teacherId', '==', teacherId), where('classId', '==', classId), orderBy('date', 'desc'));
        } else if (teacherId) {
          q = query(collection(db, 'attendance'), where('teacherId', '==', teacherId), orderBy('date', 'desc'));
        }
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Attendance));
      } catch (e) {}
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

    // If Admin adds it, it's VERIFIED. If Teacher adds it, it's SUBMITTED.
    const newStatus = asAdmin ? AttendanceStatus.VERIFIED : AttendanceStatus.SUBMITTED;

    if (db) {
      try {
        const q = query(collection(db, 'attendance'), where('teacherId', '==', teacherId), where('classId', '==', classId), where('date', '==', date));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const attendanceDoc = snapshot.docs[0];
          // Prevent teachers from deleting Verified/Paid records
          if (!asAdmin && attendanceDoc.data().status !== AttendanceStatus.SUBMITTED) {
            throw new Error("Cannot modify verified records.");
          }
          if (attendanceDoc.data().status === AttendanceStatus.PAID) throw new Error("Paid records are locked.");
          
          await deleteDoc(doc(db, 'attendance', attendanceDoc.id));
          await dbService.logEvent(EventType.ATTENDANCE_REMOVE, teacher?.name || '?', `Removed attendance for ${cls?.name} on ${date}`);
        } else {
          await addDoc(collection(db, 'attendance'), { teacherId, classId, date, status: newStatus, paymentId: null, markedAt: new Date().toISOString() });
          await dbService.logEvent(EventType.ATTENDANCE_MARK, teacher?.name || '?', `Marked lecture for ${cls?.name} on ${date}`);
        }
        return;
      } catch (e) {
        throw e;
      }
    }
    
    const data = getLocalData();
    const idx = data.attendance.findIndex(a => a.teacherId === teacherId && a.classId === classId && a.date === date);
    if (idx !== -1) {
      const record = data.attendance[idx];
      if (!asAdmin && record.status !== AttendanceStatus.SUBMITTED) throw new Error("Cannot modify verified records.");
      if (record.status === AttendanceStatus.PAID) throw new Error("Paid records are locked.");
      
      data.attendance.splice(idx, 1);
      await dbService.logEvent(EventType.ATTENDANCE_REMOVE, teacher?.name || '?', `Removed attendance for ${cls?.name} on ${date}`);
    } else {
      data.attendance.push({ id: generateId(), teacherId, classId, date, status: newStatus, paymentId: null, markedAt: new Date().toISOString() });
      await dbService.logEvent(EventType.ATTENDANCE_MARK, teacher?.name || '?', `Marked lecture for ${cls?.name} on ${date}`);
    }
    saveLocalData(data);
  },

  verifyAttendance: async (attendanceId: string) => {
    const data = getLocalData();
    const att = data.attendance.find(a => a.id === attendanceId);
    
    // DB
    if (db) {
      try { 
        await updateDoc(doc(db, 'attendance', attendanceId), { status: AttendanceStatus.VERIFIED }); 
        // Need to fetch details for log
        const snap = await getDocs(query(collection(db, 'teachers'))); // simplified fetch for log
      } catch (e) {}
    } else {
      // Local
      if (att) { att.status = AttendanceStatus.VERIFIED; saveLocalData(data); }
    }
  },

  processBulkPayment: async (teacherId: string, paymentRequests: { classId: string, lectureCount: number, amount: number }[], totalAdvanceDeduction: number = 0) => {
    const teachers = await dbService.getTeachers();
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return;

    if (db) {
      try {
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
          await dbService.logEvent(EventType.PAYMENT_PROCESSED, teacher.name, `Settled ₹${req.amount} for ${req.lectureCount} lectures.`, req.amount);
        }
        await batch.commit();
        return;
      } catch (e) {}
    }

    const data = getLocalData();
    let remainingToDeduct = totalAdvanceDeduction;
    data.advances.filter(a => a.teacherId === teacherId && a.remainingAmount > 0).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).forEach(adv => {
      if (remainingToDeduct <= 0) return;
      const deduct = Math.min(adv.remainingAmount, remainingToDeduct);
      adv.remainingAmount -= deduct;
      remainingToDeduct -= deduct;
    });

    let runningDeductionPool = totalAdvanceDeduction;
    for (const req of paymentRequests) {
      const pending = data.attendance.filter(a => a.teacherId === teacherId && a.classId === req.classId && a.status === AttendanceStatus.VERIFIED).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, req.lectureCount);
      if (pending.length === 0) continue;
      const paymentId = generateId();
      const deduction = Math.min(req.amount, runningDeductionPool);
      runningDeductionPool -= deduction;
      data.payments.push({ id: paymentId, teacherId, classId: req.classId, amount: req.amount, advanceDeduction: deduction, netDisbursement: req.amount - deduction, lectureCount: req.lectureCount, datePaid: new Date().toISOString(), startDateCovered: pending[0].date, endDateCovered: pending[pending.length - 1].date });
      pending.forEach(p => { p.status = AttendanceStatus.PAID; p.paymentId = paymentId; });
      await dbService.logEvent(EventType.PAYMENT_PROCESSED, teacher.name, `Settled ₹${req.amount} for ${req.lectureCount} lectures.`, req.amount);
    }
    saveLocalData(data);
  },

  clearDatabase: async () => {
    if (db) {
      try {
        const collections = ['teachers', 'classes', 'attendance', 'payments', 'advances', 'activityLog', 'students', 'feePayments', 'system_config'];
        for (const coll of collections) {
          const snapshot = await getDocs(collection(db, coll));
          const batch = writeBatch(db);
          snapshot.docs.forEach(d => batch.delete(d.ref));
          await batch.commit();
        }
      } catch (e) {}
    }
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  },

  seedDatabase: async () => {
    await dbService.clearDatabase();
    const classes = [
      { name: 'JEE Advanced - Batch A', batchSize: 28 },
      { name: 'JEE Mains - Batch B', batchSize: 30 }
    ];
    const classResults = await Promise.all(classes.map(c => dbService.addClass(c)));
    await dbService.addTeacher({ name: 'Tony Stark', phone: '9000011111', assignments: [{ classId: classResults[0].id, subject: 'Quantum Mechanics', rate: 150000, activeFrom: '2025-01-01' }] });
    await dbService.logEvent(EventType.TEACHER_ADD, 'SYSTEM', 'Demo environment initialized.');
  }
};
