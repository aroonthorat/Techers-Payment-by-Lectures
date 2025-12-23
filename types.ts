
export enum AttendanceStatus {
  PENDING = 'pending',
  PAID = 'paid'
}

export enum EventType {
  ATTENDANCE_MARK = 'attendance_mark',
  ATTENDANCE_REMOVE = 'attendance_remove',
  PAYMENT_PROCESSED = 'payment_processed',
  RATE_CHANGE = 'rate_change',
  TEACHER_ADD = 'teacher_add',
  ADVANCE_GRANTED = 'advance_granted',
  ADVANCE_SETTLED = 'advance_settled'
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
  remainingAmount: number; // For tracking partial settlements
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
  amount: number; // Gross amount for lectures
  advanceDeduction: number; // Amount adjusted from advance balance
  netDisbursement: number; // Actual money paid now (amount - advanceDeduction)
  lectureCount: number;
  datePaid: string;
  startDateCovered: string;
  endDateCovered: string;
}
