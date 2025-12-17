import axios from 'axios';
import type { Document, Script, AudioFile } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const documentsApi = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<{ status: string; data: { document: Document } }>(
      '/documents/upload',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data.data.document;
  },

  getAll: async () => {
    const response = await api.get<{ status: string; data: { documents: Document[] } }>(
      '/documents'
    );
    return response.data.data.documents;
  },

  getById: async (id: string) => {
    const response = await api.get<{ status: string; data: { document: Document } }>(
      `/documents/${id}`
    );
    return response.data.data.document;
  },

  getStatus: async (id: string) => {
    const response = await api.get<{ status: string; data: { document: Partial<Document> } }>(
      `/documents/${id}/status`
    );
    return response.data.data.document;
  },

  delete: async (id: string) => {
    await api.delete(`/documents/${id}`);
  },
};

export const scriptsApi = {
  getByDocumentId: async (documentId: string) => {
    const response = await api.get<{ status: string; data: { script: Script } }>(
      `/scripts/${documentId}`
    );
    return response.data.data.script;
  },

  getAll: async (documentId: string) => {
    const response = await api.get<{ status: string; data: { scripts: Script[] } }>(
      `/scripts/${documentId}/all`
    );
    return response.data.data.scripts;
  },
};

export const audioApi = {
  getByDocumentId: async (documentId: string) => {
    const response = await api.get<{ status: string; data: { audioFile: AudioFile } }>(
      `/audio/${documentId}`
    );
    return response.data.data.audioFile;
  },

  getStreamUrl: (documentId: string) => `/api/audio/${documentId}/stream`,

  getDownloadUrl: (documentId: string) => `/api/audio/${documentId}/download`,
};

export default api;
