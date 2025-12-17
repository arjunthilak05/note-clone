import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { documentsApi } from '../../api/client';
import { useNavigate } from 'react-router-dom';

export default function FileUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const document = await documentsApi.upload(file);
      navigate(`/document/${document.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  }, [navigate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled: uploading,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          transition-all duration-200
          ${isDragActive
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 bg-white hover:border-indigo-400 hover:bg-gray-50'
          }
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center space-y-4">
          {uploading ? (
            <>
              <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Uploading...
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Please wait while we process your file
                </p>
              </div>
            </>
          ) : isDragActive ? (
            <>
              <FileText className="w-16 h-16 text-indigo-600" />
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Drop your PDF here
                </p>
              </div>
            </>
          ) : (
            <>
              <Upload className="w-16 h-16 text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Upload a PDF to get started
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Drag and drop, or click to browse
                </p>
              </div>
              <div className="text-xs text-gray-400">
                Maximum file size: 50MB
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
}
