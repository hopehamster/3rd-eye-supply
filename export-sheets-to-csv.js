const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function exportSheet(fileId, name) {
  const key = JSON.parse(fs.readFileSync(path.join(__dirname, 'google-service-account-key.json'), 'utf8'));
  const auth = new google.auth.GoogleAuth({ credentials: key, scopes: ['https://www.googleapis.com/auth/drive.readonly'] });
  const drive = google.drive({ version: 'v3', auth });
  const dir = path.join(__dirname, 'downloads', 'csv');
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, `${name}.csv`);
  const res = await drive.files.export({ fileId, mimeType: 'text/csv' }, { responseType: 'arraybuffer' });
  fs.writeFileSync(out, Buffer.from(res.data));
  console.log('Exported', name, '->', out);
}

async function run() {
  // Known spreadsheet IDs
  const sheets = [
    { id: '1a2BIGelTtgDlr7dlNlpi3esWs1PeQ8SQEUFwxU9uTOY', name: 'Product Inventory' },
    { id: '1PaQPAHn1tiUhkMSrZ2kzT-ZhVIrbgRdGkmODGHRD3CE', name: 'Product Descriptions' }
  ];
  for (const s of sheets) {
    try { await exportSheet(s.id, s.name); } catch (e) { console.log('Failed', s.name, e.message); }
  }
}

run().catch(e => { console.error(e); process.exit(1); });


