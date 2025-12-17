import FileUpload from '../components/upload/FileUpload';
import { Sparkles, Mic2, Download } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
          Transform PDFs into Engaging Audio
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Upload your learning materials and get AI-generated podcast-style conversations.
          Perfect for learning on the go.
        </p>
      </div>

      {/* Upload Section */}
      <div className="max-w-2xl mx-auto">
        <FileUpload />
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto pt-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg">
            <Sparkles className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            AI-Powered Script
          </h3>
          <p className="text-gray-600">
            Advanced AI analyzes your PDF and creates a natural, engaging conversation
          </p>
        </div>

        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
            <Mic2 className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Realistic Voices
          </h3>
          <p className="text-gray-600">
            Two distinct AI voices discuss your content in a podcast format
          </p>
        </div>

        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
            <Download className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Download & Listen
          </h3>
          <p className="text-gray-600">
            Download your audio and listen anywhere, anytime
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-lg shadow-md p-8 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          How It Works
        </h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-semibold">
              1
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Upload Your PDF</h4>
              <p className="text-gray-600">
                Drag and drop your learning material (up to 50MB)
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-semibold">
              2
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">AI Processing</h4>
              <p className="text-gray-600">
                Our AI extracts key concepts and generates a conversational script
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-semibold">
              3
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Audio Generation</h4>
              <p className="text-gray-600">
                Two AI hosts bring your content to life in a podcast format
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-semibold">
              4
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Listen & Learn</h4>
              <p className="text-gray-600">
                Stream or download your personalized audio content
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
