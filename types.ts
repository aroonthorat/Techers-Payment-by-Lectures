
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
  ADVANCE_SETTLED = 'advance_settled',
  EXAM_CREATED = 'exam_created',
  MARKS_SUBMITTED = 'marks_submitted'
}

export type UserRole = 'management' | 'teacher';
export type MediumType = 'English' | 'Semi-English' | 'Urdu';
export type ExamType = 'Unit Test' | 'Midterm' | 'Final' | 'PreBoard';
export type ExamStatus = 'Draft' | 'Active' | 'Completed';

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

// --- Exam System Models ---

export interface Exam {
  id: string;
  examName: string;
  examType: ExamType;
  academicYear: string;
  startDate: string;
  endDate: string;
  class: string;
  division: string;
  medium: MediumType;
  status: ExamStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  mediumApplicability: MediumType[] | ['All'];
}

export interface ExamSubject {
  id: string;
  examId: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
}

export interface ExamPaper {
  id: string;
  examId: string;
  subjectId: string;
  paperName: string;
  maxMarks: number;
  weightage: number;
  paperOrder: number;
}

export interface TeacherExamAssignment {
  id: string;
  teacherId: string;
  examId: string;
  subjectId: string;
  paperId: string; // Specific paper assigned
  class: string;
  division: string;
  medium: MediumType;
  assignedAt: string;
}

export interface MarkEntry {
  id: string;
  examId: string;
  subjectId: string;
  paperId: string;
  studentId: string;
  studentName: string;
  studentSeatNo: string;
  studentRollNo?: string;
  class: string;
  division: string;
  medium: MediumType;
  maxMarks: number;
  obtainedMarks: number | null;
  isAbsent: boolean;
  remarks: string;
  teacherId: string;
  createdAt: string;
  updatedAt: string;
}

// --- Analytics & Grading Types ---

export interface GradeResult {
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  gradePoints: number;
  feedback: string;
  color: string;
  bgColor: string;
  isPass: boolean;
}

export interface StudentPerformanceTrend {
  studentId: string;
  averagePercentage: number;
  velocity: number; // % change per exam
  trend: 'improving' | 'stable' | 'declining';
  history: Array<{
    examId: string;
    examName: string;
    date: string;
    percentage: number;
    grade: string;
  }>;
  strengths: string[];
  weaknesses: string[];
}

export interface ClassPerformanceMetrics {
  examId: string;
  classId: string;
  averageMarks: number;
  highestScore: number;
  highestStudent?: string;
  lowestScore: number;
  passRate: number;
  failRate: number;
  difficultyIndex: 'Hard' | 'Moderate' | 'Easy';
  distribution: Record<string, number>; // Marks range -> Count
}

/**
 * Added missing ExamExportFilters type
 */
// Fix: examId is now optional to allow querying mark entries globally or without a pre-selected exam.
export interface ExamExportFilters {
  examId?: string;
  classIds?: string[];
  divisions?: string[];
  mediums?: MediumType[];
  subjectIds?: string[];
  paperIds?: string[];
  teacherId?: string;
  isAbsent?: boolean;
}

/**
 * Added missing ExportedMarkEntry type
 */
export interface ExportedMarkEntry extends MarkEntry {
  percentage: number;
  grade: string;
  teacherName: string;
}

/**
 * Added missing ExamAnalytics type
 */
export interface ExamAnalytics {
  totalStudents: number;
  averageMarks: number;
  highestMarks: number;
  highestStudent?: string;
  lowestMarks: number;
  passCount: number;
  failCount: number;
  absentCount: number;
  gradeDistribution: Record<string, number>;
}

// --- Core Models ---

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
  seatNumber: string;
  medium: MediumType;
  division?: string; 
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

export interface AppConfig {
  latestVersion: string;
  downloadUrl: string;
  forceUpdate: boolean;
  releaseNotes?: string;
}
