import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Trash2, Download, Clock } from 'lucide-react';
import { documentsApi, audioApi } from '../api/client';
import type { Document } from '../types';

export default function LibraryPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const docs = await documentsApi.getAll();
      setDocuments(docs);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, filename: string) => {
    if (!confirm(`Delete "${filename}"?`)) return;

    try {
      await documentsApi.delete(id);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    } catch (err: any) {
      alert('Failed to delete document');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600 bg-green-50';
      case 'FAILED':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'UPLOADED':
        return 'Processing...';
      case 'EXTRACTING_TEXT':
        return 'Extracting...';
      case 'GENERATING_SCRIPT':
        return 'Generating Script...';
      case 'GENERATING_AUDIO':
        return 'Generating Audio...';
      case 'COMPLETED':
        return 'Ready';
      case 'FAILED':
        return 'Failed';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          No documents yet
        </h2>
        <p className="text-gray-600 mb-6">
          Upload your first PDF to get started
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Upload Document
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Your Library</h1>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Upload New
        </button>
      </div>

      <div className="grid gap-4">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => navigate(`/document/${doc.id}`)}
                >
                  <div className="flex items-start space-x-4">
                    <FileText className="w-8 h-8 text-indigo-600 flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {doc.originalFilename}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-2">
                        <span>{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                        {doc.pageCount && <span>{doc.pageCount} pages</span>}
                        <span>
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          doc.status
                        )}`}
                      >
                        {getStatusLabel(doc.status)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {doc.status === 'COMPLETED' && doc.audioFiles?.[0] && (
                    <>
                      {doc.audioFiles[0].duration && (
                        <div className="flex items-center space-x-1 text-sm text-gray-600 px-3">
                          <Clock className="w-4 h-4" />
                          <span>
                            {Math.ceil(doc.audioFiles[0].duration / 60)} min
                          </span>
                        </div>
                      )}
                      <a
                        href={audioApi.getDownloadUrl(doc.id)}
                        download
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Download audio"
                      >
                        <Download className="w-5 h-5" />
                      </a>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(doc.id, doc.originalFilename)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
