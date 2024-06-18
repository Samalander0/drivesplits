import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { json } from '@sveltejs/kit';

import { GOOGLE_API_KEY } from '$env/static/private'
import { GOOGLE_EMAIL } from '$env/static/private'

export async function POST({ request }) {
  const data = await request.json()

  const auth = new JWT({
    email: GOOGLE_EMAIL,
    key: GOOGLE_API_KEY.split(String.raw`\n`).join('\n'),
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      // note that sharing-related calls require the google drive scope
      'https://www.googleapis.com/auth/drive.file',
    ],
  });

  const doc = new GoogleSpreadsheet(data.id, auth);
  await doc.loadInfo();

  const sheet = doc.sheetsByIndex[1];

  try {
    const rows = await sheet.addRows(data.splits);
    return new Response(JSON.stringify({ message: 'Data added successfully!' }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error adding data:', error);
    return new Response(JSON.stringify({ message: 'Error adding data!' }), {
      status: 500,
    });
  }
}