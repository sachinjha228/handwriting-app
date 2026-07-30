import React, { useState, useRef } from 'react';
import { 
  Upload, FileText, Download, Loader2, CheckCircle, FilePlus, 
  Zap, Copy, Check, History, X, Trash2, Globe, Camera, Sparkles 
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'hi', name: 'Hindi' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'auto', name: 'Auto Detect' },
];

export default function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Camera States & Ref
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const videoRef = useRef(null);

  // Load history from localStorage on initial render
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('inksync_history');
    return saved ? JSON.parse(saved) : [];
  });

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
      if (selectedFile.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(selectedFile));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  // --- Web Camera Functions ---
  const handleStartCamera = async () => {
    setIsCameraOpen(true);
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
      });
      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Unable to access camera. Please check browser permissions.');
      setIsCameraOpen(false);
    }
  };

  const handleStopCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
    setIsCameraOpen(false);
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const capturedFile = new File([blob], `camera_snapshot_${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });
        setFile(capturedFile);
        setPreviewUrl(URL.createObjectURL(blob));
        handleStopCamera();
      }
    }, 'image/jpeg', 0.95);
  };

  // --- API Handlers ---
  const handleTranscribe = async () => {
    if (!file) return;
    
    const currentFileName = file.name; 
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', selectedLanguage);

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

      // Save successful conversion to history
      const newEntry = {
        id: Date.now(),
        fileName: currentFileName,
        language: selectedLanguage,
        text: data.text,
        date: new Date().toLocaleDateString(),
      };

      const updatedHistory = [newEntry, ...history].slice(0, 10);
      setHistory(updatedHistory);
      localStorage.setItem('inksync_history', JSON.stringify(updatedHistory));

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    if (!text) return;
    setCleaning(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/cleanup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Cleanup failed');
      }

      const data = await response.json();
      setText(data.cleaned_text);
    } catch (err) {
      alert(`Cleanup Error: ${err.message}`);
    } finally {
      setCleaning(false);
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

      if (!response.ok) throw new Error('Export failed');

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

  const handleSelectHistoryItem = (item) => {
    setText(item.text);
    if (item.language) setSelectedLanguage(item.language);
    setIsHistoryOpen(false);
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('inksync_history');
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
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium px-4 py-2.5 rounded-xl transition"
            >
              <History className="w-4 h-4 text-gray-600" />
              <span>History</span>
              {history.length > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {history.length}
                </span>
              )}
            </button>
            <button className="bg-gray-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-gray-700 transition">
              Account
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 md:p-10">
        <header className="mb-12 border-b border-gray-200 pb-8">
          <h2 className="text-4xl font-extrabold text-gray-950 tracking-tighter">Handwriting to Document</h2>
          <p className="text-lg text-gray-600 mt-3 max-w-2xl">
            Upload handwritten images, take photos, or upload PDFs and convert them into editable .DOCX or print-ready .PDF files using AI.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Upload & Camera Section */}
          <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              {/* Header with Camera Action */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-50 p-3 rounded-2xl">
                    <Upload className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-950">1. Upload Document</h3>
                    <p className="text-sm text-gray-500">Provide an image, camera photo, or PDF.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStartCamera}
                  className="flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition"
                >
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span className="hidden sm:inline">Take Photo</span>
                </button>
              </div>

              {/* Language Selector Bar */}
              <div className="mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-2.5 text-gray-700 font-medium text-sm">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span>Document Language:</span>
                </div>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="bg-white border border-gray-200 rounded-xl text-sm font-semibold px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 cursor-pointer shadow-sm"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.name}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Drag & Drop Upload Zone */}
              <label className="border-2 border-dashed border-gray-300 rounded-3xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition group min-h-60 relative overflow-hidden">
                {previewUrl ? (
                  <div className="relative w-full h-48 flex items-center justify-center">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="max-h-full max-w-full object-contain rounded-2xl shadow-sm" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-2xl flex items-center justify-center text-white font-medium text-sm">
                      Click to change image
                    </div>
                  </div>
                ) : (
                  <>
                    <FilePlus className="w-12 h-12 text-gray-400 group-hover:text-blue-600 mb-4" />
                    <span className="text-base text-gray-700 font-semibold">Click to upload image/PDF</span>
                    <span className="text-sm text-gray-400 mt-2">PNG, JPG, JPEG, or PDF</span>
                  </>
                )}
                <input type="file" onChange={handleFileChange} accept="image/*,.pdf" className="hidden" />
              </label>

              {file && (
                <div className="mt-6 flex items-center justify-between text-sm text-emerald-800 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <div className="flex items-center space-x-3 truncate">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate font-medium">{file.name}</span>
                  </div>
                  <span className="text-xs bg-emerald-200/60 text-emerald-900 font-bold px-2.5 py-1 rounded-lg ml-2 flex-shrink-0">
                    {selectedLanguage}
                  </span>
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
              className="w-full mt-8 bg-blue-600 text-white font-semibold py-4 rounded-2xl hover:bg-blue-700 disabled:opacity-40 transition flex flex-col items-center justify-center text-base shadow-md"
            >
              <div className="flex items-center">
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <FileText className="w-5 h-5 mr-3" />}
                {loading ? 'AI Processing...' : `Convert (${selectedLanguage})`}
              </div>
              {loading && (
                <span className="text-xs font-normal text-blue-200 mt-1">
                  Extracting text in {selectedLanguage}...
                </span>
              )}
            </button>
          </section>

          {/* Transcribed Output Area */}
          <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
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
                placeholder="AI-extracted text will appear here. Correct any errors or run AI Cleanup before exporting..."
                className="w-full h-80 p-5 border border-gray-200 rounded-3xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-base font-sans resize-none bg-gray-50 focus:bg-white"
              ></textarea>
              
              <div className="mt-3 flex items-center justify-between text-xs text-gray-400 px-2 font-medium">
                <span>Words: {text.trim() ? text.trim().split(/\s+/).length : 0}</span>
                <span>Characters: {text.length}</span>
              </div>
            </div>

            {/* Action Toolbar */}
            <div className="mt-6 flex flex-col space-y-3">
              {/* ✨ AI Magic Cleanup Button */}
              <button
                onClick={handleCleanup}
                disabled={!text || cleaning || loading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 px-4 rounded-2xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-40 transition flex items-center justify-center text-base shadow-sm"
              >
                {cleaning ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Fixing Grammar & Formatting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    AI Magic Cleanup & Fix Grammar
                  </>
                )}
              </button>

              {/* 📋 Copy Button */}
              <button
                onClick={handleCopy}
                disabled={!text}
                className="w-full bg-gray-100 text-gray-800 font-semibold py-3 rounded-2xl hover:bg-gray-200 disabled:opacity-40 transition flex items-center justify-center text-base"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5 mr-2 text-emerald-600" /> Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 mr-2 text-gray-600" /> Copy Text
                  </>
                )}
              </button>

              {/* Export Buttons */}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-1">
                <button
                  onClick={() => handleExport('docx')}
                  disabled={!text}
                  className="flex-1 bg-emerald-600 text-white font-semibold py-3.5 rounded-2xl hover:bg-emerald-700 disabled:opacity-40 transition flex items-center justify-center text-base shadow-sm"
                >
                  <Download className="w-5 h-5 mr-2" /> Export .DOCX
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  disabled={!text}
                  className="flex-1 bg-red-600 text-white font-semibold py-3.5 rounded-2xl hover:bg-red-700 disabled:opacity-40 transition flex items-center justify-center text-base shadow-sm"
                >
                  <Download className="w-5 h-5 mr-2" /> Export .PDF
                </button>
              </div>
            </div>
          </section>
        </div>

        <footer className="mt-20 border-t border-gray-200 pt-10 text-center text-sm text-gray-500">
          InkSync &copy; 2026.
        </footer>
      </main>

      {/* Live Web Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl flex flex-col items-center relative animate-in fade-in zoom-in-95 duration-200">
            <div className="w-full flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2 text-gray-900 font-bold text-lg">
                <Camera className="w-5 h-5 text-blue-600" />
                <span>Capture Document Photo</span>
              </div>
              <button
                onClick={handleStopCamera}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-4 border-2 border-dashed border-white/40 rounded-xl pointer-events-none flex items-center justify-center">
                <span className="text-xs text-white/70 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                  Position handwriting within frame
                </span>
              </div>
            </div>

            <div className="w-full mt-6 flex items-center justify-between">
              <button
                onClick={handleStopCamera}
                className="px-5 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                Cancel
              </button>

              <button
                onClick={handleCapturePhoto}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-2xl shadow-lg transition"
              >
                <Camera className="w-5 h-5" />
                <span>Snap Photo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over History Drawer */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col p-6 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-50 p-2 rounded-xl">
                  <History className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-950">Recent History</h3>
              </div>
              <button 
                onClick={() => setIsHistoryOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto py-4 space-y-3">
              {history.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No past transcriptions found.</p>
                </div>
              ) : (
                history.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => handleSelectHistoryItem(item)}
                    className="p-4 border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 rounded-2xl cursor-pointer transition group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm text-gray-900 group-hover:text-blue-700 truncate max-w-[180px]">
                        {item.fileName}
                      </span>
                      <div className="flex items-center space-x-2">
                        {item.language && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-md">
                            {item.language}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">{item.date}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2 italic font-sans">
                      "{item.text}"
                    </p>
                  </div>
                ))
              )}
            </div>

            {history.length > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={handleClearHistory}
                  className="w-full flex items-center justify-center space-x-2 text-red-600 bg-red-50 hover:bg-red-100 font-medium py-3 rounded-xl transition text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear History</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}