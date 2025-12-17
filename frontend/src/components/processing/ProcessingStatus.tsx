import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import type { DocumentStatus } from '../../types';

interface ProcessingStatusProps {
  status: DocumentStatus;
  errorMessage?: string;
}

const statusConfig: Record<DocumentStatus, { label: string; color: string; icon: React.ReactNode }> = {
  UPLOADED: {
    label: 'Uploaded',
    color: 'blue',
    icon: <Loader2 className="w-5 h-5 animate-spin" />,
  },
  EXTRACTING_TEXT: {
    label: 'Extracting text from PDF...',
    color: 'blue',
    icon: <Loader2 className="w-5 h-5 animate-spin" />,
  },
  GENERATING_SCRIPT: {
    label: 'Generating conversational script...',
    color: 'indigo',
    icon: <Loader2 className="w-5 h-5 animate-spin" />,
  },
  GENERATING_AUDIO: {
    label: 'Generating audio (this may take several minutes)...',
    color: 'purple',
    icon: <Loader2 className="w-5 h-5 animate-spin" />,
  },
  COMPLETED: {
    label: 'Completed',
    color: 'green',
    icon: <CheckCircle className="w-5 h-5" />,
  },
  FAILED: {
    label: 'Failed',
    color: 'red',
    icon: <AlertCircle className="w-5 h-5" />,
  },
};

export default function ProcessingStatus({ status, errorMessage }: ProcessingStatusProps) {
  const config = statusConfig[status];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-3">
        <div className={`text-${config.color}-600`}>{config.icon}</div>
        <div className="flex-1">
          <h3 className={`text-lg font-semibold text-${config.color}-900`}>
            {config.label}
          </h3>
          {status === 'GENERATING_AUDIO' && (
            <p className="text-sm text-gray-600 mt-1">
              Creating audio with AI voices. This process can take 5-10 minutes depending on document length.
            </p>
          )}
          {status === 'FAILED' && errorMessage && (
            <p className="text-sm text-red-600 mt-2">{errorMessage}</p>
          )}
        </div>
      </div>

      {/* Progress Steps */}
      {status !== 'FAILED' && (
        <div className="mt-6">
          <div className="flex justify-between text-xs text-gray-600 mb-2">
            <span>Upload</span>
            <span>Extract</span>
            <span>Script</span>
            <span>Audio</span>
            <span>Done</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`bg-${config.color}-600 h-2 rounded-full transition-all duration-500`}
              style={{
                width:
                  status === 'UPLOADED'
                    ? '20%'
                    : status === 'EXTRACTING_TEXT'
                    ? '40%'
                    : status === 'GENERATING_SCRIPT'
                    ? '60%'
                    : status === 'GENERATING_AUDIO'
                    ? '80%'
                    : '100%',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
