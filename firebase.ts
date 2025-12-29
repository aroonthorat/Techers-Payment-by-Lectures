
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  writeBatch,
  Firestore,
  DocumentData
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
  Advance
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
}

const getLocalData = (): LocalDB => {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!data) return { teachers: [], classes: [], attendance: [], payments: [], advances: [], activityLog: [] };
  try {
    return JSON.parse(data);
  } catch (e) {
    return { teachers: [], classes: [], attendance: [], payments: [], advances: [], activityLog: [] };
  }
};

const saveLocalData = (data: LocalDB) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
};

const generateId = () => Math.random().toString(36).substr(2, 9);

export const dbService = {
  getTeachers: async (): Promise<Teacher[]> => {
    if (db) {
      try {
        const snapshot = await getDocs(collection(db, 'teachers'));
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Teacher));
      } catch (e) { console.warn("Firestore error, reading local..."); }
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
    const advanceData = {
      teacherId,
      amount,
      remainingAmount: amount,
      date: new Date().toISOString(),
      notes: notes || 'Advance Payment'
    };

    if (db) {
      try {
        await addDoc(collection(db, 'advances'), advanceData);
      } catch (e) {
        const data = getLocalData();
        data.advances.push({ id: generateId(), ...advanceData });
        saveLocalData(data);
      }
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
    const event = {
      type,
      teacherName,
      description,
      amount: amount || null,
      timestamp: new Date().toISOString()
    };
    if (db) {
      try {
        await addDoc(collection(db, 'activityLog'), event);
      } catch (e) {}
    } else {
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
      try {
        const teacherRef = doc(db, 'teachers', teacherId);
        await updateDoc(teacherRef, { assignments });
      } catch (e) {}
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
    if (db) {
      try {
        await deleteDoc(doc(db, 'classes', id));
      } catch (e) {}
    } else {
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

    if (db) {
      try {
        const q = query(collection(db, 'attendance'), 
          where('teacherId', '==', teacherId), 
          where('classId', '==', classId), 
          where('date', '==', date)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const attendanceDoc = snapshot.docs[0];
          const data = attendanceDoc.data();
          if (data.status === AttendanceStatus.PAID) throw new Error("Paid records are locked.");
          await deleteDoc(doc(db, 'attendance', attendanceDoc.id));
          await dbService.logEvent(EventType.ATTENDANCE_REMOVE, teacher?.name || '?', `Removed attendance for ${cls?.name} on ${date}`);
        } else {
          await addDoc(collection(db, 'attendance'), {
            teacherId, classId, date, 
            status: asAdmin ? AttendanceStatus.VERIFIED : AttendanceStatus.SUBMITTED, 
            paymentId: null, markedAt: new Date().toISOString()
          });
          await dbService.logEvent(EventType.ATTENDANCE_MARK, teacher?.name || '?', `Marked lecture for ${cls?.name} on ${date}`);
        }
        return;
      } catch (e) {}
    }
    
    const data = getLocalData();
    const idx = data.attendance.findIndex(a => a.teacherId === teacherId && a.classId === classId && a.date === date);
    if (idx !== -1) {
      if (data.attendance[idx].status === AttendanceStatus.PAID) throw new Error("Paid records are locked.");
      data.attendance.splice(idx, 1);
      await dbService.logEvent(EventType.ATTENDANCE_REMOVE, teacher?.name || '?', `Removed attendance for ${cls?.name} on ${date}`);
    } else {
      data.attendance.push({
        id: generateId(), teacherId, classId, date, 
        status: asAdmin ? AttendanceStatus.VERIFIED : AttendanceStatus.SUBMITTED, 
        paymentId: null, markedAt: new Date().toISOString()
      });
      await dbService.logEvent(EventType.ATTENDANCE_MARK, teacher?.name || '?', `Marked lecture for ${cls?.name} on ${date}`);
    }
    saveLocalData(data);
  },

  verifyAttendance: async (attendanceId: string) => {
    const data = getLocalData();
    const att = data.attendance.find(a => a.id === attendanceId);
    if (db) {
      try {
        const docRef = doc(db, 'attendance', attendanceId);
        await updateDoc(docRef, { status: AttendanceStatus.VERIFIED });
      } catch (e) {}
    } else {
      if (att) {
        att.status = AttendanceStatus.VERIFIED;
        saveLocalData(data);
      }
    }
    if (att) {
      const teachers = await dbService.getTeachers();
      const teacher = teachers.find(t => t.id === att.teacherId);
      await dbService.logEvent(EventType.ATTENDANCE_VERIFY, teacher?.name || '?', `Admin verified lecture for ${att.date}`);
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
          const q = query(collection(db, 'attendance'), 
            where('teacherId', '==', teacherId), 
            where('classId', '==', req.classId), 
            where('status', '==', AttendanceStatus.VERIFIED),
            orderBy('date', 'asc'), limit(req.lectureCount)
          );
          const snapshot = await getDocs(q);
          const paymentId = doc(collection(db, 'payments')).id;
          const deduction = Math.min(req.amount, runningDeductionPool);
          runningDeductionPool -= deduction;

          batch.set(doc(db, 'payments', paymentId), {
            teacherId, classId: req.classId, amount: req.amount, advanceDeduction: deduction, netDisbursement: req.amount - deduction,
            lectureCount: req.lectureCount, datePaid: new Date().toISOString(),
            startDateCovered: snapshot.docs[0].data().date, endDateCovered: snapshot.docs[snapshot.docs.length - 1].data().date
          });

          snapshot.docs.forEach(d => batch.update(d.ref, { status: AttendanceStatus.PAID, paymentId }));
          await dbService.logEvent(EventType.PAYMENT_PROCESSED, teacher.name, `Settled ₹${req.amount} for ${req.lectureCount} lectures.`, req.amount);
        }
        await batch.commit();
        return;
      } catch (e) {}
    }

    const data = getLocalData();
    let remainingToDeduct = totalAdvanceDeduction;
    data.advances.filter(a => a.teacherId === teacherId && a.remainingAmount > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach(adv => {
        if (remainingToDeduct <= 0) return;
        const deduct = Math.min(adv.remainingAmount, remainingToDeduct);
        adv.remainingAmount -= deduct;
        remainingToDeduct -= deduct;
      });

    let runningDeductionPool = totalAdvanceDeduction;
    for (const req of paymentRequests) {
      const pending = data.attendance.filter(a => a.teacherId === teacherId && a.classId === req.classId && a.status === AttendanceStatus.VERIFIED)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, req.lectureCount);
      
      const paymentId = generateId();
      const deduction = Math.min(req.amount, runningDeductionPool);
      runningDeductionPool -= deduction;

      data.payments.push({
        id: paymentId, teacherId, classId: req.classId, amount: req.amount, advanceDeduction: deduction, netDisbursement: req.amount - deduction,
        lectureCount: req.lectureCount, datePaid: new Date().toISOString(),
        startDateCovered: pending[0].date, endDateCovered: pending[pending.length - 1].date
      });

      pending.forEach(p => { p.status = AttendanceStatus.PAID; p.paymentId = paymentId; });
      await dbService.logEvent(EventType.PAYMENT_PROCESSED, teacher.name, `Settled ₹${req.amount} for ${req.lectureCount} lectures.`, req.amount);
    }
    saveLocalData(data);
  },

  clearDatabase: async () => {
    if (db) {
      try {
        const collections = ['teachers', 'classes', 'attendance', 'payments', 'advances', 'activityLog'];
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
      { name: 'Advanced JEE - Physics', batchSize: 28 },
      { name: 'Calculus Master - Mathematics', batchSize: 30 },
      { name: 'Organic Track - Chemistry', batchSize: 24 },
      { name: 'Elite NEET - Biology', batchSize: 28 },
      { name: 'Science Foundation - IX', batchSize: 20 },
      { name: 'Mathematics Foundation - X', batchSize: 20 },
      { name: 'Python Logic - Programming', batchSize: 15 },
      { name: 'English Boards - XII Mastery', batchSize: 25 }
    ];
    const classResults = await Promise.all(classes.map(c => dbService.addClass(c)));
    const tony = await dbService.addTeacher({
      name: 'Tony Stark', phone: '9000011111', assignments: [
        { classId: classResults[0].id, subject: 'Quantum Mechanics', rate: 150000, activeFrom: '2025-01-01' },
        { classId: classResults[1].id, subject: 'Advanced Calculus', rate: 120000, activeFrom: '2025-01-01' }
      ]
    });
    const pepper = await dbService.addTeacher({
      name: 'Pepper Potts', phone: '9000022222', assignments: [
        { classId: classResults[2].id, subject: 'Biochemistry', rate: 110000, activeFrom: '2025-01-01' },
        { classId: classResults[7].id, subject: 'Business Rhetoric', rate: 95000, activeFrom: '2025-01-01' }
      ]
    });
    await dbService.addAdvance(tony.id, 40000, 'Onboarding Security Deposit (Demo)');
    const today = new Date();
    for (let i = 0; i < 45; i++) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const isLectureDay = [1, 3, 5].includes(date.getDay());
      if (isLectureDay) {
        await dbService.toggleAttendance(tony.id, classResults[0].id, dateStr, true);
        await dbService.toggleAttendance(pepper.id, classResults[2].id, dateStr, true);
      }
    }
    await dbService.logEvent(EventType.TEACHER_ADD, 'SYSTEM', 'Environment Configured: Stark & Potts onboarded with verified history.');
  }
};
