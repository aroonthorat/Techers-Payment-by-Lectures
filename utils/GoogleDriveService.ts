
const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com'; 
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';

export const GoogleDriveService = {
  accessToken: null as string | null,

  initAuth: () => {
    return new Promise((resolve) => {
      // @ts-ignore
      const client = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.access_token) {
            GoogleDriveService.accessToken = response.access_token;
            resolve(true);
          }
        },
      });
      client.requestAccessToken();
    });
  },

  async findSyncFile() {
    const response = await fetch('https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name="edupay_pro_sync.json"', {
      headers: { 'Authorization': `Bearer ${this.accessToken}` }
    });
    const data = await response.json();
    return data.files && data.files.length > 0 ? data.files[0].id : null;
  },

  syncToDrive: async (data: any) => {
    if (!GoogleDriveService.accessToken) {
      const authed = await GoogleDriveService.initAuth();
      if (!authed) return false;
    }

    try {
      const fileId = await GoogleDriveService.findSyncFile();
      const metadata = {
        name: 'edupay_pro_sync.json',
        parents: fileId ? undefined : ['appDataFolder']
      };

      const fileContent = JSON.stringify(data);
      const boundary = '-------314159265358979323846';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";

      const body = delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        fileContent +
        close_delim;

      const url = fileId 
        ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
        : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

      const response = await fetch(url, {
        method: fileId ? 'PATCH' : 'POST',
        headers: {
          'Authorization': `Bearer ${GoogleDriveService.accessToken}`,
          'Content-Type': 'multipart/related; boundary=' + boundary
        },
        body: body
      });

      if (response.ok) {
        localStorage.setItem('edupay_last_sync', new Date().toISOString());
        return true;
      }
      return false;
    } catch (e) {
      console.error("Sync failed", e);
      return false;
    }
  },

  fetchFromDrive: async () => {
    if (!GoogleDriveService.accessToken) {
      const authed = await GoogleDriveService.initAuth();
      if (!authed) return null;
    }
    
    try {
      const fileId = await GoogleDriveService.findSyncFile();
      if (fileId) {
        const contentResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
          headers: { 'Authorization': `Bearer ${GoogleDriveService.accessToken}` }
        });
        return await contentResponse.json();
      }
    } catch (e) {
      console.error("Fetch failed", e);
    }
    return null;
  }
};
