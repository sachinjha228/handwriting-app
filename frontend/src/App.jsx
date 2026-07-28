import React, { useState } from 'react';
import { Upload, FileText, Download, Loader2, CheckCircle, FilePlus, Zap } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleTranscribe = async () => {
    if (!file) return;
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to transcribe');
      }

      const data = await response.json();
      setText(data.text);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    if (!text) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, format }),
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcription.${format}`;
      a.click();
    } catch (err) {
      alert('Export failed!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header Section */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Zap className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-gray-950">
              Ink<span className="text-blue-600">Sync</span> <span className="font-medium text-lg text-gray-500">v1.0</span>
            </h1>
          </div>
          <button className="bg-gray-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-gray-700 transition">
            Account
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 md:p-10">
        <header className="mb-12 border-b border-gray-200 pb-8">
          <h2 className="text-4xl font-extrabold text-gray-950 tracking-tighter">Handwriting to Document</h2>
          <p className="text-lg text-gray-600 mt-3 max-w-2xl">
            Upload handwritten images or PDFs and convert them into editable .DOCX or print-ready .PDF files using AI.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Upload Section */}
          <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
            <div className="flex-grow">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-blue-50 p-3 rounded-2xl">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-950">1. Upload Document</h3>
                  <p className="text-sm text-gray-500">Provide an image or PDF containing handwriting.</p>
                </div>
              </div>

              <label className="border-2 border-dashed border-gray-300 rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition group h-64">
                <FilePlus className="w-12 h-12 text-gray-400 group-hover:text-blue-600 mb-4" />
                <span className="text-base text-gray-700 font-semibold">Click to upload</span>
                <span className="text-sm text-gray-400 mt-2">PNG, JPG, JPEG, or PDF</span>
                <input type="file" onChange={handleFileChange} accept="image/*,.pdf" className="hidden" />
              </label>

              {file && (
                <div className="mt-6 flex items-center space-x-3 text-sm text-emerald-800 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate font-medium">{file.name}</span>
                </div>
              )}

              {error && (
                <div className="mt-6 text-sm text-red-800 bg-red-50 p-4 rounded-xl border border-red-100">
                  {error}
                </div>
              )}
            </div>

            <button
              onClick={handleTranscribe}
              disabled={!file || loading}
              className="w-full mt-10 bg-blue-600 text-white font-semibold py-4 rounded-2xl hover:bg-blue-700 disabled:opacity-40 transition flex items-center justify-center text-base"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <FileText className="w-5 h-5 mr-3" />}
              {loading ? 'AI Processing...' : 'Convert Handwriting'}
            </button>
          </section>

          {/* Transcribed Area */}
          <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
            <div className="flex-grow">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-amber-50 p-3 rounded-2xl">
                  <FileText className="w-8 h-8 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-950">2. Transcribed Text</h3>
                  <p className="text-sm text-gray-500">Edit and refine the computer-typed output below.</p>
                </div>
              </div>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="AI-extracted text will appear here. Correct any errors before exporting..."
                className="w-full h-80 p-5 border border-gray-200 rounded-3xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-base font-sans resize-none bg-gray-50 focus:bg-white"
              ></textarea>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => handleExport('docx')}
                disabled={!text}
                className="flex-1 bg-emerald-600 text-white font-semibold py-4 rounded-2xl hover:bg-emerald-700 disabled:opacity-40 transition flex items-center justify-center text-base"
              >
                <Download className="w-5 h-5 mr-3" /> Export .DOCX
              </button>
              <button
                onClick={() => handleExport('pdf')}
                disabled={!text}
                className="flex-1 bg-red-600 text-white font-semibold py-4 rounded-2xl hover:bg-red-700 disabled:opacity-40 transition flex items-center justify-center text-base"
              >
                <Download className="w-5 h-5 mr-3" /> Export .PDF
              </button>
            </div>
          </section>
        </div>

        <footer className="mt-20 border-t border-gray-200 pt-10 text-center text-sm text-gray-500">
          InkSync &copy; 2026.
        </footer>
      </main>
    </div>
  );
}