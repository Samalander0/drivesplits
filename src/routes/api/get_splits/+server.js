import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { json } from '@sveltejs/kit';

import { GOOGLE_API_KEY } from '$env/static/private'
import { GOOGLE_EMAIL } from '$env/static/private'

export async function GET({ url }) {
  const spreadsheetId = url.searchParams.get('id')
  const trip_id = crypto.randomUUID().substring(0, 8);

  const auth = new JWT({
    email: GOOGLE_EMAIL,
    key: GOOGLE_API_KEY.split(String.raw`\n`).join('\n'),
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      // note that sharing-related calls require the google drive scope
      'https://www.googleapis.com/auth/drive.file',
    ],
  });

  const doc = new GoogleSpreadsheet(spreadsheetId, auth);
  await doc.loadInfo();

  const sheet = doc.sheetsByIndex[0];

  const rows = await sheet.getRows();

  let splits = [];

  for (let i = 0; i < rows.length; i++) {
    let row = rows[i]
    splits.push({
      trip_id,
      title: row.get('Split Title'),
      type: "split",
      time: "-",
      start_ms: 0,
      end_ms: null,
      checked: false
    })
  }

  return json({
    splits,
    title: doc.title,
    trip_id
  })
}