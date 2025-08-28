const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const https = require('https');

async function downloadProductImages() {
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

    // Create directories for downloaded images
    const dirs = [
      'downloads/images/orgone-jewelry',
      'downloads/images/pyramids',
      'downloads/images/rings',
      'downloads/images/incense',
      'downloads/images/merkabas'
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Priority folders to download images from
    const imageFolders = [
      { 
        id: '0BxGOxkES4OqteG03SFlKLUsySTA', 
        name: 'talca orgone',
        category: 'orgone-jewelry'
      },
      { 
        id: '1ereCOYvLvFr-iI3UYJastBIvPxkhJ5jXqPoNkFM53JQ', 
        name: 'Google Photos',
        category: 'pyramids'
      },
      { 
        id: '1XvyIrtHaEa2oUBnyyfNpBmRrkuc1IEJ4', 
        name: 'Rings',
        category: 'rings'
      },
      {
        id: '1ja6iyvjU1uIYBE-yQ4DXTlWInXAwVXR5',
        name: 'Incense Labels',
        category: 'incense'
      }
    ];

    console.log('Starting product image downloads...\n');

    for (const folder of imageFolders) {
      console.log(`\n📁 Processing ${folder.name} (${folder.category})`);
      console.log('─'.repeat(50));

      try {
        // List images in folder
        const response = await drive.files.list({
          q: `'${folder.id}' in parents and (mimeType contains 'image/' or mimeType='image/gif')`,
          pageSize: 30,
          fields: 'files(id, name, mimeType, size, webContentLink)',
        });

        const files = response.data.files;
        if (files && files.length) {
          console.log(`Found ${files.length} images to download`);
          
          let downloadCount = 0;
          for (const file of files.slice(0, 10)) { // Limit to 10 per folder for now
            try {
              const fileName = file.name.replace(/[^a-z0-9.-]/gi, '_').toLowerCase();
              const filePath = path.join('downloads/images', folder.category, fileName);
              
              // Skip if already downloaded
              if (fs.existsSync(filePath)) {
                console.log(`  ✓ Already exists: ${fileName}`);
                continue;
              }

              console.log(`  ⬇ Downloading: ${fileName}`);
              
              const dest = fs.createWriteStream(filePath);
              const response = await drive.files.get(
                { fileId: file.id, alt: 'media' },
                { responseType: 'stream' }
              );
              
              await new Promise((resolve, reject) => {
                response.data
                  .on('end', () => {
                    console.log(`  ✓ Downloaded: ${fileName}`);
                    downloadCount++;
                    resolve();
                  })
                  .on('error', reject)
                  .pipe(dest);
              });

              // Small delay to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 100));
              
            } catch (error) {
              console.log(`  ✗ Failed to download ${file.name}: ${error.message}`);
            }
          }
          
          console.log(`\n✅ Downloaded ${downloadCount} new images from ${folder.name}`);
        } else {
          console.log('  No images found in this folder');
        }
      } catch (error) {
        console.log(`  ✗ Error accessing folder: ${error.message}`);
      }
    }

    console.log('\n\n=== DOWNLOAD SUMMARY ===');
    console.log('Images have been downloaded to:');
    dirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        if (files.length > 0) {
          console.log(`  📁 ${dir}: ${files.length} files`);
        }
      }
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

downloadProductImages();
