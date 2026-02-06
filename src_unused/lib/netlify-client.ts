
import { Auth } from './auth';
import { 
  Teacher, ClassType, Student, Exam, Attendance, Payment, 
  SystemEvent, FeePayment, Advance, MarkEntry, ExamPaper,
  Subject, ExamSubject, TeacherExamAssignment, ExamExportFilters
} from '../types';

const API_BASE = '/api';

const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const token = Auth.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    Auth.clearToken();
    window.location.href = '/';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
};

export const dbService = {
  // --- Core Data ---
  getTeachers: () => fetchApi('/general?type=teachers'),
  getClasses: () => fetchApi('/general?type=classes'),
  getStudents: () => fetchApi('/general?type=students'),
  getSubjects: () => fetchApi('/general?type=subjects'),
  
  // --- Exams ---
  getExams: () => fetchApi('/general?type=exams'),
  addExam: (data: any) => fetchApi('/general', {
    method: 'POST',
    body: JSON.stringify({ type: 'exams', data })
  }),
  
  // --- Attendance ---
  getAttendance: (teacherId?: string, classId?: string) => {
    const params = new URLSearchParams();
    if (teacherId) params.append('teacherId', teacherId);
    if (classId) params.append('classId', classId);
    return fetchApi(`/general?type=attendance&${params.toString()}`);
  },
  
  toggleAttendance: (teacherId: string, classId: string, date: string, asAdmin: boolean) => 
    fetchApi('/general', {
      method: 'POST',
      body: JSON.stringify({ 
        type: 'attendance_toggle', 
        data: { teacherId, classId, date, asAdmin } 
      })
    }),

  verifyAttendance: (id: string) => 
    fetchApi('/general', {
      method: 'POST',
      body: JSON.stringify({ type: 'attendance_verify', data: { id } })
    }),

  // --- Marks ---
  getMarkEntries: (filters: any) => 
    fetchApi('/general?type=marks', { 
      method: 'POST', // Using POST for complex filter body if needed, or query params
      body: JSON.stringify({ filters }) 
    }),
    
  getMarkEntriesWithFilters: (filters: ExamExportFilters) => 
    fetchApi('/general/marks/query', {
      method: 'POST',
      body: JSON.stringify(filters)
    }),

  saveMarkEntries: (entries: MarkEntry[]) => 
    fetchApi('/general', {
      method: 'POST',
      body: JSON.stringify({ type: 'marks_save', data: entries })
    }),

  initializeMarkEntries: (examId: string) => 
    fetchApi('/general', {
      method: 'POST',
      body: JSON.stringify({ type: 'marks_init', data: { examId } })
    }),

  // --- Papers & Assignments ---
  getExamPapers: (examId: string) => fetchApi(`/general?type=examPapers&examId=${examId}`),
  getExamSubjects: (examId: string) => fetchApi(`/general?type=examSubjects&examId=${examId}`),
  getTeacherExamAssignments: (teacherId?: string) => fetchApi(`/general?type=teacherAssignments${teacherId ? `&teacherId=${teacherId}` : ''}`),

  // --- Financials ---
  getPayments: () => fetchApi('/list-transactions?type=payment'),
  getFeePayments: () => fetchApi('/list-transactions?type=fee'),
  getAdvances: (teacherId?: string) => fetchApi(`/list-transactions?type=advance${teacherId ? `&staff_id=${teacherId}` : ''}`),
  
  addFeePayment: (data: any) => fetchApi('/create-transaction', {
    method: 'POST',
    body: JSON.stringify({ ...data, type: 'fee' })
  }),
  
  addAdvance: (teacherId: string, amount: number, notes: string) => fetchApi('/create-transaction', {
    method: 'POST',
    body: JSON.stringify({ staff_id: teacherId, amount, description: notes, type: 'advance' })
  }),

  processBulkPayment: (teacherId: string, requests: any[], deduction: number) => 
    fetchApi('/create-payment', {
      method: 'POST',
      body: JSON.stringify({ teacherId, requests, deduction })
    }),

  // --- System ---
  getActivityLog: () => fetchApi('/general?type=logs'),
  logEvent: (type: string, teacherName: string, description: string) => 
    fetchApi('/general', {
      method: 'POST',
      body: JSON.stringify({ type: 'log', data: { eventType: type, teacherName, description } })
    }),

  // --- Mutations ---
  addTeacher: (data: any) => fetchApi('/general', { method: 'POST', body: JSON.stringify({ type: 'teachers', data }) }),
  addClass: (data: any) => fetchApi('/general', { method: 'POST', body: JSON.stringify({ type: 'classes', data }) }),
  addStudent: (data: any) => fetchApi('/general', { method: 'POST', body: JSON.stringify({ type: 'students', data }) }),
  
  updateTeacherAssignments: (id: string, assignments: any) => 
    fetchApi('/general', { method: 'PUT', body: JSON.stringify({ type: 'teacher_assignments', id, data: assignments }) }),

  // --- Admin ---
  clearDatabase: () => fetchApi('/general', { method: 'DELETE', body: JSON.stringify({ target: 'all' }) }),
  seedDatabase: () => fetchApi('/seed-db', { method: 'POST' }),
};
