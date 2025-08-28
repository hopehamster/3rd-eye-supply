const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function exploreDriveContent() {
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

    // Main folders to explore
    const mainFolders = [
      { id: '0BxGOxkES4OqteG03SFlKLUsySTA', name: 'talca orgone' },
      { id: '1ja6iyvjU1uIYBE-yQ4DXTlWInXAwVXR5', name: 'Incense Labels' },
      { id: '1LBLCZSro2n2c5DYBs1C_84TnxxBW_rpZ', name: 'Shared Docs' },
      { id: '1PfjxK-T-PZdxz7dY9J1daMncw-Hue4my', name: 'Marketing' },
      { id: '10CRCky6QGjzB_Xq7pwSqWMvTTk1YPZGm', name: 'Venders' },
      { id: '1XvyIrtHaEa2oUBnyyfNpBmRrkuc1IEJ4', name: 'Unknown1' },
      { id: '1ereCOYvLvFr-iI3UYJastBIvPxkhJ5jXqPoNkFM53JQ', name: 'Google Photos' },
      { id: '13sKHcFTR-_uJ5-XhGAo7TzP94BCg3ULB', name: 'Business Files' },
      { id: '1s9Sac7VQRkxW52SmaNi0-4i4zSQTbBVx', name: 'Product Photos' },
      { id: '1t6fJtDabnrG0Cl9XyGMRHSSCJ7_qEIsY', name: 'Unknown2' },
      { id: '1aQpV84GF4ImEM_LzfCwG1M5NDkVgEzMy', name: 'Etsy' }
    ];

    // Spreadsheets
    const spreadsheets = [
      { id: '1X5xAg5STuTFZQWuNXt0HZVDwAneZ4l9IFl2XqBP8jAE', name: 'Passwords and Login' },
      { id: '1KBBY2FQ05nxu21lXhDEnDNk4SIpfvLXdK5TobkJVnwA', name: 'Dropshipping Stores' }
    ];

    // Document
    const document = { id: '1JU8ekJezdyatXWpOsbbUeHQN5JFfcf2uPSW9Z1IqDi4', name: 'Unknown Document' };

    console.log('=== GOOGLE DRIVE CONTENT EXPLORATION ===\n');

    // Explore folders
    for (const folder of mainFolders) {
      console.log(`\n📁 ${folder.name} (${folder.id})`);
      console.log('─'.repeat(50));
      
      try {
        // List files in this folder
        const response = await drive.files.list({
          q: `'${folder.id}' in parents and trashed = false`,
          pageSize: 20,
          fields: 'files(id, name, mimeType, size, webViewLink)',
          orderBy: 'name'
        });

        const files = response.data.files;
        if (files && files.length) {
          files.forEach(file => {
            const type = file.mimeType.includes('folder') ? '📂' : 
                        file.mimeType.includes('image') ? '🖼️' : 
                        file.mimeType.includes('document') ? '📄' : 
                        file.mimeType.includes('spreadsheet') ? '📊' : '📎';
            const size = file.size ? ` (${(file.size / 1024).toFixed(1)} KB)` : '';
            console.log(`  ${type} ${file.name}${size}`);
          });
        } else {
          console.log('  (empty or no access to contents)');
        }
      } catch (error) {
        console.log(`  ✗ Error accessing folder: ${error.message}`);
      }
    }

    // Check spreadsheets
    console.log('\n\n📊 SPREADSHEETS');
    console.log('─'.repeat(50));
    for (const sheet of spreadsheets) {
      try {
        const response = await drive.files.get({
          fileId: sheet.id,
          fields: 'id,name,mimeType,webViewLink'
        });
        console.log(`✓ ${response.data.name}`);
        console.log(`  Link: ${response.data.webViewLink}`);
      } catch (error) {
        console.log(`✗ Cannot access ${sheet.name}: ${error.message}`);
      }
    }

    // Check document
    console.log('\n\n📄 DOCUMENTS');
    console.log('─'.repeat(50));
    try {
      const response = await drive.files.get({
        fileId: document.id,
        fields: 'id,name,mimeType,webViewLink'
      });
      console.log(`✓ ${response.data.name}`);
      console.log(`  Link: ${response.data.webViewLink}`);
    } catch (error) {
      console.log(`✗ Cannot access document: ${error.message}`);
    }

    // Look for business plan or important documents
    console.log('\n\n🔍 SEARCHING FOR KEY DOCUMENTS');
    console.log('─'.repeat(50));
    const searchQueries = [
      "name contains 'business' and mimeType != 'application/vnd.google-apps.folder'",
      "name contains 'plan' and mimeType != 'application/vnd.google-apps.folder'",
      "name contains 'product' and mimeType != 'application/vnd.google-apps.folder'",
      "name contains 'inventory' and mimeType != 'application/vnd.google-apps.folder'",
      "name contains 'supplier' and mimeType != 'application/vnd.google-apps.folder'"
    ];

    for (const query of searchQueries) {
      try {
        const response = await drive.files.list({
          q: query,
          pageSize: 5,
          fields: 'files(id, name, mimeType, parents)',
        });
        
        if (response.data.files && response.data.files.length) {
          response.data.files.forEach(file => {
            console.log(`✓ Found: ${file.name} (${file.id})`);
          });
        }
      } catch (error) {
        console.log(`  Error searching: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

exploreDriveContent();
