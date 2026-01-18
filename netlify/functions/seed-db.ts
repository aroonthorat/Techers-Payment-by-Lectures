
import { Handler } from '@netlify/functions';
import { Client } from 'pg';

const handler: Handler = async () => {
  const client = new Client({ connectionString: process.env.NETLIFY_DB_CONNECTION_STRING });
  await client.connect();

  try {
    // Create Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS institutes (id SERIAL PRIMARY KEY, name TEXT);
      CREATE TABLE IF NOT EXISTS teachers (id TEXT PRIMARY KEY, name TEXT, phone TEXT, assignments JSONB);
      CREATE TABLE IF NOT EXISTS classes (id TEXT PRIMARY KEY, name TEXT, batch_size INT);
      CREATE TABLE IF NOT EXISTS students (id TEXT PRIMARY KEY, name TEXT, seat_number TEXT, medium TEXT, enrollments JSONB);
      CREATE TABLE IF NOT EXISTS attendance (id SERIAL PRIMARY KEY, teacher_id TEXT, class_id TEXT, date TEXT, status TEXT, UNIQUE(teacher_id, class_id, date));
      CREATE TABLE IF NOT EXISTS transactions (id SERIAL PRIMARY KEY, institute_id INT, staff_id TEXT, amount DECIMAL, type TEXT, status TEXT, description TEXT, created_at TIMESTAMP DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS exams (id TEXT PRIMARY KEY, exam_name TEXT, class_id TEXT, start_date TEXT, status TEXT);
      CREATE TABLE IF NOT EXISTS mark_entries (id TEXT PRIMARY KEY, exam_id TEXT, student_id TEXT, marks INT, is_absent BOOLEAN);
    `);

    // Seed Data (Minimal)
    await client.query(`
      INSERT INTO teachers (id, name, phone) VALUES ('t1', 'PROF. KHAN', '9999999999') ON CONFLICT DO NOTHING;
      INSERT INTO classes (id, name, batch_size) VALUES ('c1', '12th SCIENCE', 28) ON CONFLICT DO NOTHING;
    `);

    return { statusCode: 200, body: 'Database Seeded' };
  } catch (e: any) {
    return { statusCode: 500, body: e.message };
  } finally {
    await client.end();
  }
};

export { handler };
