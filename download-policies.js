const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function run() {
  const keyPath = path.join(__dirname, 'google-service-account-key.json');
  const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/drive.readonly']
  });
  const drive = google.drive({ version: 'v3', auth });

  const targetFolderId = '1t6fJtDabnrG0Cl9XyGMRHSSCJ7_qEIsY';
  const outDir = path.join(__dirname, 'downloads', 'policies');
  fs.mkdirSync(outDir, { recursive: true });

  const list = await drive.files.list({
    q: `'${targetFolderId}' in parents and trashed = false`,
    fields: 'files(id,name,mimeType)',
    pageSize: 100
  });

  const files = list.data.files || [];
  console.log(`Found ${files.length} files in policies folder`);

  for (const file of files) {
    const safeName = file.name.replace(/[^a-z0-9._ -]/gi, '_');
    const isGDoc = file.mimeType === 'application/vnd.google-apps.document';
    const outPathTxt = path.join(outDir, `${safeName}.txt`);

    try {
      if (isGDoc) {
        const resp = await drive.files.export({ fileId: file.id, mimeType: 'text/plain' }, { responseType: 'arraybuffer' });
        fs.writeFileSync(outPathTxt, Buffer.from(resp.data));
        console.log(`✓ Exported ${file.name} -> ${path.basename(outPathTxt)}`);
      } else if (file.mimeType.startsWith('text/')) {
        const resp = await drive.files.get({ fileId: file.id, alt: 'media' }, { responseType: 'arraybuffer' });
        fs.writeFileSync(outPathTxt, Buffer.from(resp.data));
        console.log(`✓ Downloaded ${file.name} -> ${path.basename(outPathTxt)}`);
      } else {
        console.log(`Skipped ${file.name} (${file.mimeType})`);
      }
    } catch (e) {
      console.log(`✗ Failed ${file.name}: ${e.message}`);
    }
  }
}

run().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});


