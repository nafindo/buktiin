import { google } from 'googleapis';
import path from 'path';

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, 'service-account.json'),
  scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'],
});

async function testConnection() {
  try {
    const drive = google.drive({ version: 'v3', auth });
    console.log('Menghubungkan ke Google Drive...');
    
    const res = await drive.files.get({
      fileId: '1RzzoTN6TAWdjzchTclguyaExAbuM3q0O',
      fields: 'id, name, mimeType'
    });
    
    console.log('✅ KONEKSI BERHASIL!');
    console.log('Detail Folder Tujuan:');
    console.log(res.data);
  } catch (error: any) {
    console.error('❌ KONEKSI GAGAL!');
    console.error(error.message);
  }
}

testConnection();
