
import { Handler } from '@netlify/functions';
import { Client } from 'pg';

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const client = new Client({ connectionString: process.env.NETLIFY_DB_CONNECTION_STRING });
  await client.connect();

  try {
    const { institute_id, staff_id, amount, type, status, description } = JSON.parse(event.body || '{}');

    const res = await client.query(
      `INSERT INTO transactions (institute_id, staff_id, amount, type, status, description)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [institute_id || 1, staff_id, amount, type, status || 'completed', description]
    );

    return { statusCode: 200, body: JSON.stringify(res.rows[0]) };
  } catch (e: any) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  } finally {
    await client.end();
  }
};

export { handler };
