import { ApiError } from '../lib/api';
import { API_BASE_URL } from '../lib/config';

export type UploadedFile = {
  url: string;
  filename: string;
  mimetype: string;
  size: number;
  storageProvider: string;
  objectKey?: string;
};

type UploadOptions = {
  folder?: string;
  onProgress?: (progress: number) => void;
};

function parseUploadResponse(xhr: XMLHttpRequest) {
  try {
    return JSON.parse(xhr.responseText || '{}');
  } catch {
    return { message: xhr.responseText || 'Server returned an invalid response.' };
  }
}

export function uploadFileWithProgress(file: File, options: UploadOptions = {}) {
  const { folder, onProgress } = options;

  return new Promise<UploadedFile>((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) formData.append('folder', folder);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}/upload`);

    const token = localStorage.getItem('thpt_token');
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.upload.onprogress = event => {
      if (!event.lengthComputable || !onProgress) return;
      onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
    };

    xhr.onload = () => {
      const response = parseUploadResponse(xhr);

      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new ApiError(response.message || response.error || `Upload failed (${xhr.status})`, xhr.status, response));
        return;
      }

      onProgress?.(100);
      resolve(response.data ?? response);
    };

    xhr.onerror = () => {
      reject(new ApiError('Backend tạm thời không phản hồi khi upload file.', 0, null));
    };

    xhr.onabort = () => {
      reject(new ApiError('Upload đã bị hủy.', 0, null));
    };

    xhr.send(formData);
  });
}

export function uploadExamPdf(file: File, options: Omit<UploadOptions, 'folder'> = {}) {
  return uploadFileWithProgress(file, { ...options, folder: 'pdfs' });
}
