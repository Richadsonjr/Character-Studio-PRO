
/**
 * Serviço para integração com Google Drive API v3
 */

const DRIVE_FOLDER_NAME = "Character Studio PRO";

export async function getAccessToken(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Fixed: Cast window to any to access the 'google' property from the Identity Services script
    const client = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (response: any) => {
        if (response.error) reject(response);
        resolve(response.access_token);
      },
    });
    client.requestAccessToken();
  });
}

async function fetchDrive(endpoint: string, options: RequestInit, token: string) {
  const res = await fetch(`https://www.googleapis.com/drive/v3/${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Erro na Google Drive API");
  }
  return res.json();
}

export async function findOrCreateFolder(token: string): Promise<string> {
  const query = encodeURIComponent(`name = '${DRIVE_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const list = await fetchDrive(`files?q=${query}`, { method: 'GET' }, token);
  
  if (list.files && list.files.length > 0) {
    return list.files[0].id;
  }

  const folder = await fetchDrive('files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: DRIVE_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder'
    })
  }, token);

  return folder.id;
}

export async function uploadFile(
  token: string, 
  folderId: string, 
  name: string, 
  mimeType: string, 
  base64Data: string
): Promise<void> {
  const metadata = {
    name,
    parents: [folderId],
    mimeType
  };

  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  
  // Converte base64 para Blob
  const byteString = atob(base64Data.split(',')[1] || base64Data);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
  const blob = new Blob([ab], { type: mimeType });
  
  formData.append('file', blob);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  if (!response.ok) throw new Error("Falha no upload do arquivo");
}
