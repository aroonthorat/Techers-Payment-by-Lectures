
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

export const generateAttendanceSheet = (data: ExportedMarkEntry[], meta: { examName: string, subjectName: string, date: string, className: string }) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const rowsHtml = data.map((m, i) => `
    <tr style="border-bottom: 1px solid #000;">
      <td style="padding: 8px; border: 1px solid #000; text-align: center;">${i + 1}</td>
      <td style="padding: 8px; border: 1px solid #000; font-family: monospace;">${m.studentSeatNo}</td>
      <td style="padding: 8px; border: 1px solid #000; text-transform: uppercase; font-weight: bold;">${m.studentName}</td>
      <td style="padding: 8px; border: 1px solid #000; text-align: center;">${m.medium}</td>
      <td style="padding: 8px; border: 1px solid #000; width: 80px;"></td>
      <td style="padding: 8px; border: 1px solid #000; width: 100px;"></td>
    </tr>
  `).join('');

  const html = `
    <html>
      <head>
        <title>Attendance Sheet - ${meta.examName}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #000; }
          .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 20px; margin-bottom: 30px; }
          .inst-name { font-size: 28px; font-weight: 900; margin: 0; letter-spacing: 2px; }
          .doc-title { font-size: 18px; font-weight: bold; margin: 10px 0; text-transform: uppercase; border: 2px solid #000; display: inline-block; padding: 5px 20px; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; font-size: 14px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #f2f2f2; border: 1px solid #000; padding: 10px; text-transform: uppercase; font-size: 12px; }
          .footer { margin-top: 50px; display: flex; justify-content: space-between; font-weight: bold; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="inst-name">USTAD COACHING CLASSES</h1>
          <div class="doc-title">Class Attendance & Mark Record</div>
        </div>
        <div class="meta-grid">
          <div>BATCH: ${meta.className}</div>
          <div>EXAM: ${meta.examName}</div>
          <div>SUBJECT: ${meta.subjectName}</div>
          <div>DATE: ${meta.date}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 40px;">Sr.No</th>
              <th style="width: 100px;">Seat No</th>
              <th>Student Full Name</th>
              <th style="width: 80px;">Medium</th>
              <th>Mark</th>
              <th>Signature</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <div class="footer">
          <div>Supervisor Signature: _________________</div>
          <div>Exam Head: _________________</div>
        </div>
        <script>window.onload = () => { window.print(); window.close(); };</script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
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
