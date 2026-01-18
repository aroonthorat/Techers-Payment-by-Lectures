
// NOTE: Replace with your actual Google Cloud Console Client ID
const CLIENT_ID = '922902324707-164720977239.apps.googleusercontent.com'; // Placeholder
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

declare var google: any;

export const GoogleDriveService = {
  accessToken: null as string | null,
  tokenClient: null as any,

  init: () => {
    if (typeof google === 'undefined') return Promise.resolve(false);
    
    return new Promise((resolve) => {
      try {
        // @ts-ignore
        GoogleDriveService.tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: (response: any) => {
            if (response.access_token) {
              GoogleDriveService.accessToken = response.access_token;
              resolve(true);
            } else {
              resolve(false);
            }
          },
        });
        resolve(true);
      } catch (e) {
        console.error("Google Identity Services not loaded", e);
        resolve(false);
      }
    });
  },

  signIn: () => {
    return new Promise((resolve) => {
      if (!GoogleDriveService.tokenClient) {
        GoogleDriveService.init().then(() => {
           if(GoogleDriveService.tokenClient) GoogleDriveService.tokenClient.requestAccessToken({ prompt: 'consent' });
        });
      } else {
        // @ts-ignore
        GoogleDriveService.tokenClient.callback = (resp) => {
           if(resp.access_token) {
             GoogleDriveService.accessToken = resp.access_token;
             resolve(true);
           } else {
             resolve(false);
           }
        };
        GoogleDriveService.tokenClient.requestAccessToken({ prompt: '' });
      }
    });
  },

  signOut: () => {
    if (GoogleDriveService.accessToken) {
      // @ts-ignore
      google.accounts.oauth2.revoke(GoogleDriveService.accessToken, () => {
        GoogleDriveService.accessToken = null;
      });
    }
  },

  isAuthenticated: () => !!GoogleDriveService.accessToken,

  async findSyncFile() {
    if (!GoogleDriveService.accessToken) return null;
    try {
      const response = await fetch('https://www.googleapis.com/drive/v3/files?q=name="edupay_pro_backup.json" and trashed=false&fields=files(id, name)', {
        headers: { 'Authorization': `Bearer ${GoogleDriveService.accessToken}` }
      });
      const data = await response.json();
      return data.files && data.files.length > 0 ? data.files[0].id : null;
    } catch (e) {
      console.error("Error finding file", e);
      return null;
    }
  },

  saveData: async (data: any) => {
    if (!GoogleDriveService.accessToken) return false;

    try {
      const fileId = await GoogleDriveService.findSyncFile();
      const metadata = {
        name: 'edupay_pro_backup.json',
        mimeType: 'application/json'
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

      return response.ok;
    } catch (e) {
      console.error("Drive Upload Failed", e);
      return false;
    }
  },

  loadData: async () => {
    if (!GoogleDriveService.accessToken) return null;
    try {
      const fileId = await GoogleDriveService.findSyncFile();
      if (fileId) {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
          headers: { 'Authorization': `Bearer ${GoogleDriveService.accessToken}` }
        });
        return await response.json();
      }
    } catch (e) {
      console.error("Drive Download Failed", e);
    }
    return null;
  }
};
