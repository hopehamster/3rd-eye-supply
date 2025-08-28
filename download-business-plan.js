const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function downloadBusinessPlan() {
  try {
    // Load the service account key
    const keyPath = path.join(__dirname, 'google-service-account-key.json');
    const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

    // Configure authentication
    const auth = new google.auth.GoogleAuth({
      credentials: key,
      scopes: ['https://www.googleapis.com/auth/drive.readonly']
    });

    // Create Drive client
    const drive = google.drive({ version: 'v3', auth });

    // Business plan document IDs
    const businessPlanIds = [
      { id: '1sUFeuv6FchPXlgKdd3ZqqQEwjNgvS-o7baJMV8VxPUg', name: '3rd Eye Supply Business Plan' },
      { id: '1kpE4XprsYLbwwnXuKzmCqzK3ExANTgn8', name: '3rd Eye Supply Business Plan.pdf' }
    ];

    // Product related documents
    const productDocs = [
      { id: '1PaQPAHn1tiUhkMSrZ2kzT-ZhVIrbgRdGkmODGHRD3CE', name: 'Product Descriptions' },
      { id: '1a2BIGelTtgDlr7dlNlpi3esWs1PeQ8SQEUFwxU9uTOY', name: 'Product Inventory' }
    ];

    console.log('Downloading business documents...\n');

    // Download PDFs
    for (const doc of businessPlanIds) {
      if (doc.name.includes('.pdf')) {
        try {
          console.log(`Downloading ${doc.name}...`);
          const dest = fs.createWriteStream(path.join(__dirname, 'downloads', doc.name));
          const response = await drive.files.get(
            { fileId: doc.id, alt: 'media' },
            { responseType: 'stream' }
          );
          
          response.data
            .on('end', () => console.log(`✓ Downloaded ${doc.name}`))
            .on('error', err => console.error('Error downloading', err))
            .pipe(dest);
        } catch (error) {
          console.log(`✗ Could not download ${doc.name}: ${error.message}`);
        }
      }
    }

    // Export Google Docs as text
    for (const doc of [...businessPlanIds.filter(d => !d.name.includes('.pdf')), ...productDocs]) {
      try {
        console.log(`\nExporting ${doc.name} as text...`);
        const response = await drive.files.export({
          fileId: doc.id,
          mimeType: 'text/plain'
        });
        
        const filename = path.join(__dirname, 'downloads', `${doc.name}.txt`);
        fs.writeFileSync(filename, response.data);
        console.log(`✓ Exported ${doc.name} to ${filename}`);
        
        // Show first 500 characters
        console.log('\nContent preview:');
        console.log('─'.repeat(50));
        console.log(response.data.substring(0, 500) + '...\n');
      } catch (error) {
        console.log(`✗ Could not export ${doc.name}: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Create downloads directory if it doesn't exist
if (!fs.existsSync('downloads')) {
  fs.mkdirSync('downloads');
}

downloadBusinessPlan();
