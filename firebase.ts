
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
  Firestore
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
  if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) return import.meta.env[key];
  return undefined;
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID')
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

if (firebaseConfig.projectId && firebaseConfig.projectId !== 'undefined') {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
  } catch (error) {
    console.error("Firebase Initialization Failed:", error);
  }
}

const fetchCollection = async <T>(collectionName: string): Promise<T[]> => {
  if (!db) return [];
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
};

export const dbService = {
  getTeachers: async (): Promise<Teacher[]> => fetchCollection<Teacher>('teachers'),
  getClasses: async (): Promise<ClassType[]> => fetchCollection<ClassType>('classes'),
  
  getAdvances: async (teacherId?: string): Promise<Advance[]> => {
    if (!db) return [];
    let q = query(collection(db, 'advances'), orderBy('date', 'desc'));
    if (teacherId) q = query(collection(db, 'advances'), where('teacherId', '==', teacherId), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Advance));
  },

  addAdvance: async (teacherId: string, amount: number, notes?: string) => {
    if (!db) throw new Error("Database not connected");
    const teachers = await dbService.getTeachers();
    const teacher = teachers.find(t => t.id === teacherId);
    
    await addDoc(collection(db, 'advances'), {
      teacherId,
      amount,
      remainingAmount: amount,
      date: new Date().toISOString(),
      notes: notes || 'Advance Payment'
    });
    
    await dbService.logEvent(EventType.ADVANCE_GRANTED, teacher?.name || '?', `Granted advance of ₹${amount}`, amount);
  },

  getPayments: async (): Promise<Payment[]> => {
    if (!db) return [];
    const q = query(collection(db, 'payments'), orderBy('datePaid', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
  },
  
  getActivityLog: async (): Promise<SystemEvent[]> => {
    if (!db) return [];
    const q = query(collection(db, 'activityLog'), orderBy('timestamp', 'desc'), limit(100));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SystemEvent));
  },

  logEvent: async (type: EventType, teacherName: string, description: string, amount?: number) => {
    if (!db) return;
    await addDoc(collection(db, 'activityLog'), {
      type,
      teacherName,
      description,
      amount: amount || null,
      timestamp: new Date().toISOString()
    });
  },

  addTeacher: async (teacher: Omit<Teacher, 'id'>) => {
    if (!db) throw new Error("Database not connected");
    const docRef = await addDoc(collection(db, 'teachers'), teacher);
    await dbService.logEvent(EventType.TEACHER_ADD, teacher.name, `Added new teacher: ${teacher.name}`);
    return { id: docRef.id, ...teacher };
  },

  updateTeacherAssignments: async (teacherId: string, assignments: TeacherAssignment[]) => {
    if (!db) throw new Error("Database not connected");
    const teacherRef = doc(db, 'teachers', teacherId);
    await updateDoc(teacherRef, { assignments });
    const teachers = await dbService.getTeachers();
    const t = teachers.find(item => item.id === teacherId);
    if (t) await dbService.logEvent(EventType.RATE_CHANGE, t.name, `Updated assignments for ${t.name}`);
  },

  addClass: async (cls: Omit<ClassType, 'id'>) => {
    if (!db) throw new Error("Database not connected");
    const docRef = await addDoc(collection(db, 'classes'), cls);
    return { id: docRef.id, ...cls };
  },

  deleteClass: async (id: string) => {
    if (!db) throw new Error("Database not connected");
    await deleteDoc(doc(db, 'classes', id));
  },

  getAttendance: async (teacherId?: string, classId?: string) => {
    if (!db) return [];
    let q = query(collection(db, 'attendance'), orderBy('date', 'desc'));
    if (teacherId && classId) {
      q = query(collection(db, 'attendance'), where('teacherId', '==', teacherId), where('classId', '==', classId), orderBy('date', 'desc'));
    } else if (teacherId) {
      q = query(collection(db, 'attendance'), where('teacherId', '==', teacherId), orderBy('date', 'desc'));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance));
  },

  toggleAttendance: async (teacherId: string, classId: string, date: string) => {
    if (!db) throw new Error("Database not connected");
    const q = query(collection(db, 'attendance'), 
      where('teacherId', '==', teacherId), 
      where('classId', '==', classId), 
      where('date', '==', date)
    );
    const snapshot = await getDocs(q);
    
    const teachers = await dbService.getTeachers();
    const teacher = teachers.find(t => t.id === teacherId);
    const classes = await dbService.getClasses();
    const cls = classes.find(c => c.id === classId);

    if (!snapshot.empty) {
      const attendanceDoc = snapshot.docs[0];
      const data = attendanceDoc.data() as Attendance;
      if (data.status === AttendanceStatus.PAID) throw new Error("Paid records are locked.");
      await deleteDoc(doc(db, 'attendance', attendanceDoc.id));
      await dbService.logEvent(EventType.ATTENDANCE_REMOVE, teacher?.name || '?', `Removed attendance for ${cls?.name} on ${date}`);
    } else {
      await addDoc(collection(db, 'attendance'), {
        teacherId,
        classId,
        date,
        status: AttendanceStatus.PENDING,
        paymentId: null,
        markedAt: new Date().toISOString()
      });
      await dbService.logEvent(EventType.ATTENDANCE_MARK, teacher?.name || '?', `Marked lecture for ${cls?.name} on ${date}`);
    }
  },

  processBulkPayment: async (teacherId: string, paymentRequests: { classId: string, lectureCount: number, amount: number }[], useAdvance: boolean = false) => {
    if (!db) throw new Error("Database not connected");
    const batch = writeBatch(db);
    const teachers = await dbService.getTeachers();
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return;

    // Get active advances
    const advancesSnapshot = await getDocs(query(collection(db, 'advances'), where('teacherId', '==', teacherId), where('remainingAmount', '>', 0), orderBy('date', 'asc')));
    const activeAdvances = advancesSnapshot.docs.map(d => ({ id: d.id, ref: d.ref, ...d.data() } as Advance & { ref: any }));
    let currentAdvancePool = useAdvance ? activeAdvances.reduce((sum, a) => sum + a.remainingAmount, 0) : 0;

    for (const req of paymentRequests) {
      const { classId, lectureCount, amount } = req;
      
      const q = query(collection(db, 'attendance'), 
        where('teacherId', '==', teacherId), 
        where('classId', '==', classId), 
        where('status', '==', AttendanceStatus.PENDING),
        orderBy('date', 'asc'),
        limit(lectureCount)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.size < lectureCount) continue;

      const paymentId = doc(collection(db, 'payments')).id;
      const timestamps = snapshot.docs.map(d => new Date((d.data() as Attendance).date).getTime());
      
      // Calculate advance deduction for this specific class payment
      const deductionForThisClass = Math.min(amount, currentAdvancePool);
      currentAdvancePool -= deductionForThisClass;
      
      // Update individual advance documents in the batch
      if (deductionForThisClass > 0) {
        let remainingToDeduct = deductionForThisClass;
        for (const adv of activeAdvances) {
          if (remainingToDeduct <= 0) break;
          const deductFromAdv = Math.min(adv.remainingAmount, remainingToDeduct);
          if (deductFromAdv > 0) {
            adv.remainingAmount -= deductFromAdv;
            batch.update(adv.ref, { remainingAmount: adv.remainingAmount });
            remainingToDeduct -= deductFromAdv;
          }
        }
      }

      const payment: Omit<Payment, 'id'> = {
        teacherId,
        classId,
        amount,
        advanceDeduction: deductionForThisClass,
        netDisbursement: amount - deductionForThisClass,
        lectureCount,
        datePaid: new Date().toISOString(),
        startDateCovered: new Date(Math.min(...timestamps)).toISOString(),
        endDateCovered: new Date(Math.max(...timestamps)).toISOString()
      };

      batch.set(doc(db, 'payments', paymentId), payment);

      snapshot.docs.forEach(attendanceDoc => {
        batch.update(attendanceDoc.ref, {
          status: AttendanceStatus.PAID,
          paymentId: paymentId
        });
      });

      const logMsg = deductionForThisClass > 0 
        ? `Settled ₹${amount} for ${lectureCount} lecs (₹${deductionForThisClass} adjusted from advance, ₹${amount - deductionForThisClass} cash)`
        : `Finalized payment of ₹${amount} for ${lectureCount} lectures`;

      await dbService.logEvent(EventType.PAYMENT_PROCESSED, teacher.name, logMsg, amount);
    }
    
    await batch.commit();
  }
};
