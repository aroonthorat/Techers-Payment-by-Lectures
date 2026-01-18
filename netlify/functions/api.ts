
import { Handler } from '@netlify/functions';
import { Client } from 'pg';
import jwt from 'jsonwebtoken';

const dbConfig = {
  connectionString: process.env.NETLIFY_DB_CONNECTION_STRING,
};

const verifyToken = (headers: any) => {
  const authHeader = headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, process.env.ADMIN_AUTH_SECRET!);
  } catch (e) {
    return null;
  }
};

const handler: Handler = async (event, context) => {
  const client = new Client(dbConfig);
  await client.connect();

  try {
    // Auth check
    const user = verifyToken(event.headers);
    if (!user && event.path !== '/api/login') { // Allow login
      // For trial/demo purposes allowing read-only might be handled here
      // return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const method = event.httpMethod;
    const type = event.queryStringParameters?.type || JSON.parse(event.body || '{}').type;

    // GET Handlers
    if (method === 'GET') {
      if (type === 'teachers') {
        const res = await client.query('SELECT * FROM teachers');
        return { statusCode: 200, body: JSON.stringify(res.rows) };
      }
      if (type === 'classes') {
        const res = await client.query('SELECT * FROM classes');
        return { statusCode: 200, body: JSON.stringify(res.rows) };
      }
      if (type === 'students') {
        const res = await client.query('SELECT * FROM students');
        return { statusCode: 200, body: JSON.stringify(res.rows) };
      }
      if (type === 'attendance') {
        // Mock query - adjust SQL for real filters
        const res = await client.query('SELECT * FROM attendance ORDER BY date DESC LIMIT 500');
        return { statusCode: 200, body: JSON.stringify(res.rows) };
      }
      if (type === 'exams') {
        const res = await client.query('SELECT * FROM exams');
        return { statusCode: 200, body: JSON.stringify(res.rows) };
      }
    }

    // POST Handlers
    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      
      if (body.type === 'attendance_toggle') {
        const { teacherId, classId, date, asAdmin } = body.data;
        // Logic to insert/delete attendance
        await client.query(
          `INSERT INTO attendance (teacher_id, class_id, date, status) 
           VALUES ($1, $2, $3, $4) 
           ON CONFLICT (teacher_id, class_id, date) DO UPDATE SET status = $4`,
          [teacherId, classId, date, asAdmin ? 'verified' : 'submitted']
        );
        return { statusCode: 200, body: JSON.stringify({ success: true }) };
      }
      
      if (body.type === 'marks_save') {
        // Bulk upsert marks
        // For simplicity in this mock, looping inserts (use unnest in production)
        for (const entry of body.data) {
          await client.query(
            `INSERT INTO mark_entries (id, exam_id, student_id, marks, is_absent)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO UPDATE SET marks = $4, is_absent = $5`,
            [entry.id, entry.examId, entry.studentId, entry.obtainedMarks, entry.isAbsent]
          );
        }
        return { statusCode: 200, body: JSON.stringify({ success: true }) };
      }
    }

    return { statusCode: 404, body: 'Not Found' };

  } catch (error: any) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  } finally {
    await client.end();
  }
};

export { handler };
