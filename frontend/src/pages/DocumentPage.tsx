import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Clock } from 'lucide-react';
import { documentsApi, scriptsApi, audioApi } from '../api/client';
import type { Document, Script, AudioFile, ConversationalScript } from '../types';
import ProcessingStatus from '../components/processing/ProcessingStatus';
import AudioPlayer from '../components/audio/AudioPlayer';

export default function DocumentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [script, setScript] = useState<Script | null>(null);
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const doc = await documentsApi.getById(id);
        setDocument(doc);

        // If completed, fetch script and audio
        if (doc.status === 'COMPLETED') {
          try {
            const scriptData = await scriptsApi.getByDocumentId(id);
            setScript(scriptData);
          } catch (err) {
            console.error('Script not found');
          }

          try {
            const audioData = await audioApi.getByDocumentId(id);
            setAudioFile(audioData);
          } catch (err) {
            console.error('Audio not found');
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load document');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Poll for status updates if not completed
    const interval = setInterval(async () => {
      if (!id) return;

      try {
        const statusData = await documentsApi.getStatus(id);
        setDocument((prev) => (prev ? { ...prev, ...statusData } : null));

        // If just completed, fetch script and audio
        if (statusData.status === 'COMPLETED') {
          const scriptData = await scriptsApi.getByDocumentId(id);
          setScript(scriptData);

          const audioData = await audioApi.getByDocumentId(id);
          setAudioFile(audioData);

          clearInterval(interval);
        }

        // Stop polling on failure
        if (statusData.status === 'FAILED') {
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Failed to fetch status');
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-800">{error || 'Document not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-indigo-600 hover:text-indigo-800"
          >
            Go back home
          </button>
        </div>
      </div>
    );
  }

  const parsedScript: ConversationalScript | null = script
    ? JSON.parse(script.content)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/library')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </button>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <FileText className="w-8 h-8 text-indigo-600 flex-shrink-0" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {document.originalFilename}
                </h1>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                  <span>{(document.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                  {document.pageCount && <span>{document.pageCount} pages</span>}
                  <span>
                    Uploaded {new Date(document.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Processing Status */}
      {document.status !== 'COMPLETED' && (
        <ProcessingStatus
          status={document.status}
          errorMessage={document.errorMessage}
        />
      )}

      {/* Audio Player */}
      {document.status === 'COMPLETED' && audioFile && (
        <AudioPlayer
          audioUrl={audioApi.getStreamUrl(document.id)}
          downloadUrl={audioApi.getDownloadUrl(document.id)}
          title={parsedScript?.title || 'Audio Podcast'}
        />
      )}

      {/* Script Preview */}
      {document.status === 'COMPLETED' && parsedScript && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {parsedScript.title}
            </h2>
            {script?.estimatedDuration && (
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{Math.ceil(script.estimatedDuration / 60)} min</span>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {parsedScript.segments.map((segment, segIdx) => (
              <div key={segIdx} className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-500 uppercase">
                  {segment.type}
                </h3>
                <div className="space-y-4">
                  {segment.dialogue.map((line, lineIdx) => (
                    <div
                      key={lineIdx}
                      className={`flex space-x-3 ${
                        line.speaker === 'host1' ? 'justify-start' : 'justify-end'
                      }`}
                    >
                      <div
                        className={`max-w-2xl rounded-lg p-4 ${
                          line.speaker === 'host1'
                            ? 'bg-blue-50 text-gray-900'
                            : 'bg-purple-50 text-gray-900'
                        }`}
                      >
                        <p className="font-semibold text-sm mb-1">
                          {line.speakerName}
                        </p>
                        <p className="text-sm">{line.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
