'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useRef } from 'react';

interface AnalysisResults {
  score: number;
  matchPercentage: number;
  matchScore: number;
  atsScore?: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  missingKeywords: string[];
}

export default function ResumeAnalyzer() {
  const { isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Paste text state
  const [pastedText, setPastedText] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  // UI state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Section expand/collapse state
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    strengths: true,
    improvements: true,
    keywords: true,
  });

  const displayScore = results?.matchScore ?? results?.atsScore ?? results?.score ?? 0;

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Copy suggestions to clipboard
  const handleCopy = (text: string, sectionName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionName);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (uploadedFile: File) => {
    setError(null);
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    const extension = uploadedFile.name.split('.').pop()?.toLowerCase();
    const isValidExtension = ['pdf', 'docx', 'txt'].includes(extension || '');

    if (!validTypes.includes(uploadedFile.type) && !isValidExtension) {
      setError('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
      return;
    }

    if (uploadedFile.size > 5 * 1024 * 1024) {
      setError('File is too large. Max file size is 5MB.');
      return;
    }

    setFile(uploadedFile);
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Generate a cache key from the resume + job description text
  const getCacheKey = (resume: string, jd: string) => {
    const combinedInput = (resume + (jd || '')).trim();
    return `resume_analysis_${btoa(unescape(encodeURIComponent(combinedInput.slice(0, 100)))).slice(0, 32)}`;
  };

  // Analyze Resume - API Integration with localStorage Caching
  const handleAnalyze = async () => {
    setError(null);
    let resumeContent = '';

    if (activeTab === 'upload') {
      if (!file) {
        setError('Please upload a resume file first.');
        return;
      }
      if (file.type === 'text/plain') {
        resumeContent = await file.text();
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // Basic fallback text extraction from PDF binary string
        resumeContent = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result;
            if (typeof result === 'string') {
              const text = result.replace(/[^\x20-\x7E\n]/g, ' ');
              resolve(text);
            } else {
              reject(new Error('Failed to read file as string'));
            }
          };
          reader.onerror = () => reject(new Error('File reading error'));
          reader.readAsBinaryString(file);
        });
      } else {
        // Fallback for DOCX or other
        resumeContent = await file.text();
      }
    } else {
      if (!pastedText.trim()) {
        setError('Please paste your resume text.');
        return;
      }
      resumeContent = pastedText;
    }

    // 1. Check localStorage cache first
    const cacheKey = getCacheKey(resumeContent, jobDescription);
    try {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        setResults(JSON.parse(cachedData));
        return;
      }
    } catch (e) {
      localStorage.removeItem(cacheKey);
    }

    // 2. Execute fetch request if not cached
    try {
      setIsAnalyzing(true);
      setResults(null);

      const response = await fetch('/api/analyze-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeContent, jobDescription }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setError(data.error || 'API quota limit reached. Please try again later.');
          return;
        }
        throw new Error(data.error || 'Failed to analyze resume.');
      }

      const analysisResult: AnalysisResults = {
        score: data.matchScore || 0,
        matchPercentage: data.matchScore || 0,
        matchScore: data.matchScore || 0,
        summary: data.summary || '',
        strengths: data.strengths || [],
        improvements: data.improvements || [],
        missingKeywords: data.missingKeywords || [],
      };

      // Save result to localStorage cache
      try {
        localStorage.setItem(cacheKey, JSON.stringify(analysisResult));
      } catch (e) {
        // localStorage might be full, silently ignore
      }
      setResults(analysisResult);
    } catch (error) {
      console.error('Error analyzing resume:', error);
      setError(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const isButtonDisabled = activeTab === 'upload' ? !file : !pastedText.trim();

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="mb-4">
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">AI Resume Analyzer</h2>
        <p className="text-gray-600 text-sm mt-1">
          Get instant, ATS-focused feedback. Upload your resume and optionally include a target job description to verify keyword optimization, layout compliance, and formatting strength.
        </p>
      </div>

      {/* Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT PANEL: INPUT SECTION */}
        <section className="lg:col-span-5 bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-6">
          {/* Tabs */}
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-3">Resume Source</label>
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                onClick={() => { setActiveTab('upload'); setError(null); }}
                className={`py-2 text-sm font-semibold rounded-md transition-all ${activeTab === 'upload'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Upload File
              </button>
              <button
                onClick={() => { setActiveTab('paste'); setError(null); }}
                className={`py-2 text-sm font-semibold rounded-md transition-all ${activeTab === 'paste'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Paste Text
              </button>
            </div>
          </div>

          {/* Input Content Area */}
          <div className="min-h-[220px]">
            {activeTab === 'upload' ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${dragActive
                  ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
                  : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50'
                  }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileChange}
                />
                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mb-3">
                  📄
                </div>
                <p className="font-semibold text-gray-800 text-sm mb-1">
                  Drag and drop your file here, or <span className="text-blue-600">browse</span>
                </p>
                <p className="text-xs text-gray-500">Supports PDF, DOCX, TXT (Max 5MB)</p>
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  placeholder="Paste the plain text of your resume here..."
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  maxLength={15000}
                  className="w-full h-[220px] p-4 bg-slate-50/50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none resize-none text-sm text-gray-800"
                />
                <div className="flex justify-end text-xs text-gray-500">
                  {pastedText.length} / 15,000 characters
                </div>
              </div>
            )}
          </div>

          {/* File Preview */}
          {activeTab === 'upload' && file && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between animate-fadeIn">
              <div className="flex items-center space-x-3">
                <div className="text-xl">📄</div>
                <div className="max-w-[200px] sm:max-w-xs truncate">
                  <p className="text-sm font-semibold text-gray-800 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-red-100 hover:text-red-600 flex items-center justify-center text-gray-600 font-bold transition-all text-xs"
                title="Remove file"
              >
                ✕
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg flex items-start gap-2">
              <span className="font-bold">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Optional Target Job Description */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 block">
              Target Job Description <span className="text-gray-400 font-normal">(Optional, recommended)</span>
            </label>
            <textarea
              placeholder="Paste the job description to calculate job match accuracy... or leave empty for a General Resume Audit."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              maxLength={5000}
              className="w-full h-[120px] p-3 bg-slate-50/50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none resize-none text-sm text-gray-800"
            />
          </div>

          {/* Action Button */}
          <button
            onClick={handleAnalyze}
            disabled={isButtonDisabled || isAnalyzing}
            className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${isButtonDisabled || isAnalyzing
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-[0.98]'
              }`}
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Analyzing Resume...</span>
              </>
            ) : (
              <>
                <span>🔍</span>
                <span>Analyze Resume</span>
              </>
            )}
          </button>
        </section>

        {/* RIGHT PANEL: RESULTS SECTION */}
        <section className="lg:col-span-7 space-y-6">
          {/* Empty State */}
          {!isAnalyzing && !results && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-12 text-center flex flex-col items-center justify-center min-h-[450px] animate-fadeIn">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-inner border border-blue-100">
                🔍
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Analyze</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6 text-sm leading-relaxed">
                Upload your resume or paste the text, then click Analyze to calculate your ATS compatibility.
              </p>
              <button
                onClick={() => {
                  if (activeTab === 'upload') {
                    fileInputRef.current?.click();
                  } else {
                    const pasteArea = document.querySelector('textarea') as HTMLTextAreaElement;
                    if (pasteArea) pasteArea.focus();
                  }
                }}
                className="px-6 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
              >
                Browse File
              </button>
            </div>
          )}

          {/* Results Display Panel */}
          {!isAnalyzing && results && (
            <div className="space-y-6">
              {/* Score Summary Overview Card */}
              <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  
                  {/* Left Column: ATS Score Circle Badge (3 cols) */}
                  <div className="lg:col-span-3 flex items-center justify-center lg:justify-start gap-4">
                    <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-gray-200"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-amber-500 transition-all duration-1000 ease-out"
                          strokeDasharray={`${displayScore}, 100`}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-black text-gray-900 leading-none">
                          {displayScore}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 tracking-wider uppercase mt-1">
                          ATS SCORE
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Overall Score Rating Text (4 cols) */}
                  <div className="lg:col-span-4 space-y-1 text-center lg:text-left">
                    <h3 className="text-lg font-bold text-gray-900 leading-snug">
                      Overall score rating
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                      {results.summary}
                    </p>
                  </div>

                  {/* Right Column: Job Description Match Progress Bar (5 cols) */}
                  <div className="lg:col-span-5 space-y-2 border-t lg:border-t-0 pt-4 lg:pt-0 border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-900">
                        Job Description Match
                      </span>
                      <span className="text-sm font-bold text-amber-600">
                        {displayScore}%
                      </span>
                    </div>
                    
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 via-teal-400 to-teal-500 rounded-full transition-all duration-700"
                        style={{ width: `${displayScore}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-gray-400 leading-normal">
                      Standard generic match score evaluation. Add target job description for exact results.
                    </p>
                  </div>

                </div>
              </div>

                {/* Summary Segment */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => toggleSection('summary')}
                      className="flex items-center space-x-2 font-bold text-gray-800 text-base"
                    >
                      <span>{expandedSections.summary ? '▼' : '▶'}</span>
                      <span>Professional Summary Assessment</span>
                    </button>
                    <button
                      onClick={() => handleCopy(results.summary, 'summary')}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                    >
                      {copiedSection === 'summary' ? 'Copied! ✓' : '📋 Copy Feedback'}
                    </button>
                  </div>
                  {expandedSections.summary && (
                    <p className="text-sm text-gray-600 leading-relaxed bg-slate-50 border border-slate-100 rounded-xl p-4 animate-fadeIn">
                      {results.summary}
                    </p>
                  )}
                </div>
              </div>

              {/* Strengths & Positive Points */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={() => toggleSection('strengths')}
                    className="flex items-center space-x-2 font-bold text-gray-800 text-base"
                  >
                    <span>{expandedSections.strengths ? '▼' : '▶'}</span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-teal-600">✓</span> Formatting Strengths
                    </span>
                  </button>
                  <button
                    onClick={() => handleCopy(results.strengths.join('\n'), 'strengths')}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                  >
                    {copiedSection === 'strengths' ? 'Copied! ✓' : '📋 Copy Lists'}
                  </button>
                </div>
                {expandedSections.strengths && (
                  <ul className="space-y-3 pl-4 animate-fadeIn">
                    {results.strengths.map((strength, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-teal-600 font-bold shrink-0 mt-0.5">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Improvements & Warnings */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={() => toggleSection('improvements')}
                    className="flex items-center space-x-2 font-bold text-gray-800 text-base"
                  >
                    <span>{expandedSections.improvements ? '▼' : '▶'}</span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-amber-500">⚠️</span> Required Improvements
                    </span>
                  </button>
                  <button
                    onClick={() => handleCopy(results.improvements.join('\n'), 'improvements')}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                  >
                    {copiedSection === 'improvements' ? 'Copied! ✓' : '📋 Copy List'}
                  </button>
                </div>
                {expandedSections.improvements && (
                  <ul className="space-y-3 pl-4 animate-fadeIn">
                    {results.improvements.map((improvement, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-amber-500 font-bold shrink-0 mt-0.5">⚠</span>
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Missing Keywords Tag List */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={() => toggleSection('keywords')}
                    className="flex items-center space-x-2 font-bold text-gray-800 text-base"
                  >
                    <span>{expandedSections.keywords ? '▼' : '▶'}</span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-red-500">🛑</span> Missing Keywords
                    </span>
                  </button>
                  <button
                    onClick={() => handleCopy(results.missingKeywords.join(', '), 'keywords')}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                  >
                    {copiedSection === 'keywords' ? 'Copied! ✓' : '📋 Copy Keywords'}
                  </button>
                </div>
                {expandedSections.keywords && (
                  <div className="space-y-4 animate-fadeIn">
                    <p className="text-xs text-gray-500 leading-normal">
                      We scanned standard job matches in your industry. Adding these missing skills / keywords will increase ATS recognition.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {results.missingKeywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="bg-red-50 text-red-700 border border-red-100 rounded-full px-3 py-1 text-xs font-bold transition-all hover:bg-red-100"
                        >
                          + {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Share report */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Result shareable link copied to clipboard!');
                  }}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl transition-all shadow-sm active:scale-[0.98]"
                >
                  🔗 Share Analysis Report
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
