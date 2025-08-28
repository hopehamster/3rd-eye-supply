const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function testDriveAccess() {
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

    // List files shared with the service account
    console.log('Attempting to list files...');
    const response = await drive.files.list({
      pageSize: 10,
      fields: 'files(id, name, mimeType)',
      q: "sharedWithMe=true or '0BxGOxkES4OqteG03SFlKLUsySTA' in parents or '1ja6iyvjU1uIYBE-yQ4DXTlWInXAwVXR5' in parents"
    });

    const files = response.data.files;
    if (files && files.length) {
      console.log('Files found:');
      files.forEach(file => {
        console.log(`- ${file.name} (${file.id})`);
      });
    } else {
      console.log('No files found.');
    }

    // Try to access specific folders
    const folderIds = [
      '0BxGOxkES4OqteG03SFlKLUsySTA',
      '1ja6iyvjU1uIYBE-yQ4DXTlWInXAwVXR5',
      '1LBLCZSro2n2c5DYBs1C_84TnxxBW_rpZ',
      '1PfjxK-T-PZdxz7dY9J1daMncw-Hue4my'
    ];

    for (const folderId of folderIds) {
      try {
        console.log(`\nTrying to access folder: ${folderId}`);
        const folderResponse = await drive.files.get({
          fileId: folderId,
          fields: 'id,name,mimeType'
        });
        console.log(`✓ Found: ${folderResponse.data.name}`);
      } catch (error) {
        console.log(`✗ Cannot access folder ${folderId}: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testDriveAccess();
