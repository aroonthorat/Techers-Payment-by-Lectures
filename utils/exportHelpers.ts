
import { ExportedMarkEntry } from '../types';

export const generateCSV = (data: ExportedMarkEntry[], filename: string) => {
  const headers = [
    'Student Name', 'Seat No', 'Class', 'Division', 'Medium', 
    'Subject ID', 'Paper ID', 'Max Marks', 'Obtained Marks', 
    'Percentage', 'Grade', 'Is Absent', 'Remarks', 'Entered By'
  ];

  const rows = data.map(m => [
    m.studentName,
    m.studentSeatNo,
    m.class,
    m.division,
    m.medium,
    m.subjectId,
    m.paperId,
    m.maxMarks,
    m.obtainedMarks || 0,
    m.percentage,
    m.grade,
    m.isAbsent ? 'YES' : 'NO',
    m.remarks || '',
    m.teacherName || 'Unknown'
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.map(val => `"${val}"`).join(','))
  ].join('\n');

  downloadFile(csvContent, 'text/csv', filename);
};

export const generateJSON = (data: ExportedMarkEntry[], filename: string) => {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, 'application/json', filename);
};

const downloadFile = (content: string, mimeType: string, filename: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
