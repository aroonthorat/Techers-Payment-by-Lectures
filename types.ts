
export enum AttendanceStatus {
  SUBMITTED = 'submitted',
  VERIFIED = 'verified',
  PAID = 'paid'
}

export enum EventType {
  ATTENDANCE_MARK = 'attendance_mark',
  ATTENDANCE_VERIFY = 'attendance_verify',
  ATTENDANCE_REMOVE = 'attendance_remove',
  PAYMENT_PROCESSED = 'payment_processed',
  RATE_CHANGE = 'rate_change',
  TEACHER_ADD = 'teacher_add',
  ADVANCE_GRANTED = 'advance_granted',
  ADVANCE_SETTLED = 'advance_settled'
}

export type UserRole = 'management' | 'teacher';

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
}

export interface SystemEvent {
  id: string;
  type: EventType;
  timestamp: string;
  teacherName: string; 
  description: string;
  amount?: number;
}

export interface TeacherAssignment {
  classId: string;
  subject: string;
  rate: number; 
  activeFrom: string; 
}

export interface Advance {
  id: string;
  teacherId: string;
  amount: number;
  date: string;
  remainingAmount: number;
  notes?: string;
}

export interface Teacher {
  id: string;
  name: string;
  phone: string;
  assignments: TeacherAssignment[];
}

export interface ClassType {
  id: string;
  name: string;
  batchSize: number; 
}

export interface Attendance {
  id: string;
  teacherId: string;
  classId: string;
  date: string; 
  status: AttendanceStatus;
  paymentId: string | null;
  rateSnapshot?: number;
  markedAt?: string;
}

export interface Payment {
  id: string;
  teacherId: string;
  classId: string;
  amount: number;
  advanceDeduction: number;
  netDisbursement: number;
  lectureCount: number;
  datePaid: string;
  startDateCovered: string;
  endDateCovered: string;
}

export interface Enrollment {
  classId: string;
  totalFee: number;
  enrolledAt: string;
}

export interface Student {
  id: string;
  name: string;
  phone: string;
  enrollments: Enrollment[];
}

export interface FeePayment {
  id: string;
  studentId: string;
  amount: number;
  date: string;
  notes?: string;
}

// Configuration for App Updates
export interface AppConfig {
  latestVersion: string; // e.g. "1.0.1"
  downloadUrl: string;   // Link to the new APK
  forceUpdate: boolean;  // If true, user cannot close the modal
  releaseNotes?: string;
}
