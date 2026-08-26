'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useEffect, KeyboardEvent } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface RoadmapPhase {
  phase: number;
  title: string;
  duration: string;
  color: string;
  activities: string[];
  skills: string[];
  milestones: string[];
}

interface CareerRoadmapFormData {
  targetTitle: string;
  targetCompany: string;
  timeline: string;
  industry: string;
  skillsToLearn: string[];
  workMode: string;
}

interface FormErrors {
  targetTitle?: string;
  timeline?: string;
  industry?: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const INDUSTRY_OPTIONS = [
  'Technology',
  'Finance',
  'Marketing',
  'Healthcare',
  'Education',
  'Design',
  'Data Science',
  'DevOps',
  'Product Management',
  'Sales',
];
const TIMELINE_OPTIONS = ['1 year', '2 years', '3 years', '5 years'];
const WORK_MODE_OPTIONS = ['Remote', 'Hybrid', 'On-site'];

const PHASE_COLORS = [
  { bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-600', text: 'text-blue-700', light: 'bg-blue-600', badge: 'bg-blue-100 text-blue-700' },
  { bg: 'bg-purple-50', border: 'border-purple-200', dot: 'bg-purple-600', text: 'text-purple-700', light: 'bg-purple-600', badge: 'bg-purple-100 text-purple-700' },
  { bg: 'bg-teal-50', border: 'border-teal-200', dot: 'bg-teal-600', text: 'text-teal-700', light: 'bg-teal-600', badge: 'bg-teal-100 text-teal-700' },
  { bg: 'bg-indigo-50', border: 'border-indigo-200', dot: 'bg-indigo-600', text: 'text-indigo-700', light: 'bg-indigo-600', badge: 'bg-indigo-100 text-indigo-700' },
];

// ─── Tag Input Component ────────────────────────────────────────────────────────
function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder,
  id,
}: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
  id: string;
}) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
      e.preventDefault();
      onAdd(inputValue.trim().replace(/,$/, ''));
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      onRemove(tags.length - 1);
    }
  };

  return (
    <div className="min-h-[44px] w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 flex flex-wrap gap-1.5 items-center cursor-text">
      {tags.map((tag, i) => (
        <span key={i} className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">
          {tag}
          <button
            onClick={() => onRemove(i)}
            className="w-3.5 h-3.5 rounded-full bg-blue-200 hover:bg-blue-300 text-blue-700 flex items-center justify-center leading-none transition-colors"
            type="button"
            aria-label={`Remove ${tag}`}
          >
            ✕
          </button>
        </span>
      ))}
      <input
        id={id}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : 'Add more...'}
        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
      />
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function CareerRoadmap() {
  const { user, isLoaded } = useUser();

  // Form state
  const [formData, setFormData] = useState<CareerRoadmapFormData>({
    targetTitle: '',
    targetCompany: '',
    timeline: '',
    industry: '',
    skillsToLearn: [],
    workMode: 'Hybrid',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [expandedSections, setExpandedSections] = useState({ target: true, preferences: true });
  const [expandedPhases, setExpandedPhases] = useState<Record<number, boolean>>({});

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [roadmap, setRoadmap] = useState<RoadmapPhase[] | null>(null);
  const [visiblePhases, setVisiblePhases] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Custom inputs state
  const [customIndustry, setCustomIndustry] = useState('');
  const [isCustomIndustry, setIsCustomIndustry] = useState(false);
  const [customTimeline, setCustomTimeline] = useState('');
  const [isCustomTimeline, setIsCustomTimeline] = useState(false);
  const [savedIndustries, setSavedIndustries] = useState<string[]>([]);
  
  // Saved plans view state
  const [viewMode, setViewMode] = useState<'generate' | 'saved'>('generate');
  const [savedRoadmaps, setSavedRoadmaps] = useState<any[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  useEffect(() => {
    const local = localStorage.getItem('custom_roadmap_industries');
    if (local) {
      try {
        setSavedIndustries(JSON.parse(local));
      } catch (e) {}
    }
  }, []);

  // Staggered phase reveal after generation
  useEffect(() => {
    if (roadmap) {
      setVisiblePhases([]);
      roadmap.forEach((_, i) => {
        setTimeout(() => {
          setVisiblePhases(prev => [...prev, i]);
        }, 150 * i);
      });
    }
  }, [roadmap]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  // ── Field helpers ──────────────────────────────────────────────────────────
  const setField = <K extends keyof CareerRoadmapFormData>(key: K, value: CareerRoadmapFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [key]: undefined }));
    }
  };

  const addSkill = (value: string) => {
    if (value && !formData.skillsToLearn.includes(value)) {
      setField('skillsToLearn', [...formData.skillsToLearn, value]);
    }
  };

  const removeSkill = (index: number) => {
    setField('skillsToLearn', formData.skillsToLearn.filter((_, i) => i !== index));
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const togglePhase = (index: number) => {
    setExpandedPhases(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const resetForm = () => {
    setFormData({
      targetTitle: '',
      targetCompany: '',
      timeline: '',
      industry: '',
      skillsToLearn: [],
      workMode: 'Hybrid',
    });
    setCustomIndustry('');
    setIsCustomIndustry(false);
    setCustomTimeline('');
    setIsCustomTimeline(false);
    setErrors({});
    setRoadmap(null);
    setVisiblePhases([]);
    setApiError(null);
    setSaveSuccess(false);
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.targetTitle.trim()) newErrors.targetTitle = 'Target job title is required.';
    if (!formData.industry) newErrors.industry = 'Please select an industry.';
    if (!formData.timeline) newErrors.timeline = 'Please select a timeline.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Generate Roadmap ───────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!validate()) {
      setExpandedSections({ target: true, preferences: true });
      return;
    }

    if (isCustomIndustry && formData.industry) {
      const newIndustries = Array.from(new Set([...savedIndustries, formData.industry]));
      setSavedIndustries(newIndustries);
      localStorage.setItem('custom_roadmap_industries', JSON.stringify(newIndustries));
    }

    setIsGenerating(true);
    setLoadingStep(0);
    setRoadmap(null);
    setApiError(null);

    // Simulate loading steps visually
    const loadingInterval = setInterval(() => {
      setLoadingStep(prev => (prev < 3 ? prev + 1 : 3));
    }, 1200);

    try {
      const response = await fetch('/api/generate-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate career roadmap');
      }

      if (Array.isArray(data) && data.length > 0) {
        setRoadmap(data);
        setExpandedPhases(Object.fromEntries(data.map((_, i) => [i, i === 0])));
      } else {
        throw new Error('No roadmap phases were generated. Please try again.');
      }
    } catch (error: any) {
      console.error('Error generating roadmap:', error);
      setApiError(error.message || 'Something went wrong while generating your roadmap.');
    } finally {
      clearInterval(loadingInterval);
      setLoadingStep(4);
      setTimeout(() => setIsGenerating(false), 500);
    }
  };

  const handleSaveRoadmap = async () => {
    if (!roadmap) return;
    setIsSaving(true);
    setApiError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch('/api/roadmaps/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          roadmapData: roadmap,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save roadmap');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error('Error saving roadmap:', error);
      setApiError(error.message || 'Something went wrong while saving your roadmap.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    if (!roadmap) return;
    const text = roadmap.map(p =>
      `PHASE ${p.phase}: ${p.title} (${p.duration})\nActivities:\n${p.activities.map(a => `  • ${a}`).join('\n')}\nSkills: ${p.skills.join(', ')}\nMilestones:\n${p.milestones.map(m => `  ✓ ${m}`).join('\n')}\n`
    ).join('\n───────────────────────────────\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800';
  const selectCls = inputCls + ' appearance-none cursor-pointer';
  const errorCls = 'text-xs text-red-500 mt-1';
  const labelCls = 'text-sm font-semibold text-gray-700 mb-1.5 block';
  const sectionHeaderCls = 'flex items-center justify-between w-full py-3 border-b border-slate-100 mb-4 cursor-pointer group';

  const phaseColorMap: Record<string, (typeof PHASE_COLORS)[number]> = {
    blue: PHASE_COLORS[0],
    purple: PHASE_COLORS[1],
    teal: PHASE_COLORS[2],
    indigo: PHASE_COLORS[3],
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Career Roadmap</h2>
          <p className="text-gray-600 text-sm mt-1">
            Build a phase-by-phase action plan with skill targets and milestones.
          </p>
        </div>
        <div className="flex p-1 bg-slate-100 rounded-lg shrink-0">
          <button
            onClick={() => setViewMode('generate')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${viewMode === 'generate' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Generate New
          </button>
          <button
            onClick={() => {
              setViewMode('saved');
              setIsLoadingSaved(true);
              fetch('/api/roadmaps/get')
                .then(res => res.json())
                .then(data => {
                  if (data.roadmaps) setSavedRoadmaps(data.roadmaps);
                  setIsLoadingSaved(false);
                })
                .catch(() => setIsLoadingSaved(false));
            }}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${viewMode === 'saved' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Saved Plans
          </button>
        </div>
      </div>

      {viewMode === 'generate' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Form Panel */}
        <section className="lg:col-span-5 bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-1">

          {/* ── Section 1: Target Job ── */}
          <div>
            <button type="button" onClick={() => toggleSection('target')} className={sectionHeaderCls}>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                <span className="font-bold text-gray-800">Target Job</span>
              </div>
              <span className="text-gray-400 group-hover:text-gray-600 text-xs transition-colors">
                {expandedSections.target ? '▲ Hide' : '▼ Show'}
              </span>
            </button>

            {expandedSections.target && (
              <div className="space-y-4 pb-4 animate-fadeIn">
                {/* Job Title */}
                <div>
                  <label htmlFor="targetTitle" className={labelCls}>
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="targetTitle"
                    type="text"
                    placeholder="e.g. Senior Software Engineer"
                    value={formData.targetTitle}
                    onChange={e => setField('targetTitle', e.target.value)}
                    className={`${inputCls} ${errors.targetTitle ? 'border-red-400 focus:ring-red-400' : ''}`}
                  />
                  {errors.targetTitle && <p className={errorCls}>{errors.targetTitle}</p>}
                </div>

                {/* Target Company */}
                <div>
                  <label htmlFor="targetCompany" className={labelCls}>
                    Target Company <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    id="targetCompany"
                    type="text"
                    placeholder="e.g. Stripe, Google, or any startup"
                    value={formData.targetCompany}
                    onChange={e => setField('targetCompany', e.target.value)}
                    className={inputCls}
                  />
                </div>

                {/* Industry */}
                <div>
                  <label htmlFor="industry" className={labelCls}>
                    Industry <span className="text-red-500">*</span>
                  </label>
                  {!isCustomIndustry ? (
                    <select
                      id="industry"
                      value={formData.industry}
                      onChange={e => {
                        if (e.target.value === 'custom') {
                          setIsCustomIndustry(true);
                          setField('industry', '');
                        } else {
                          setField('industry', e.target.value);
                        }
                      }}
                      className={`${selectCls} ${errors.industry ? 'border-red-400' : ''}`}
                    >
                      <option value="">Select industry...</option>
                      {INDUSTRY_OPTIONS.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                      {savedIndustries.map(ind => <option key={`saved-${ind}`} value={ind}>{ind}</option>)}
                      <option value="custom">Custom / Add New Industry...</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Type custom industry..."
                        value={formData.industry}
                        onChange={e => setField('industry', e.target.value)}
                        className={`${inputCls} ${errors.industry ? 'border-red-400 focus:ring-red-400' : ''}`}
                        autoFocus
                      />
                      <button type="button" onClick={() => { setIsCustomIndustry(false); setField('industry', ''); }} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                    </div>
                  )}
                  {errors.industry && <p className={errorCls}>{errors.industry}</p>}
                </div>

                {/* Timeline */}
                <div>
                  <label htmlFor="timeline" className={labelCls}>
                    Timeline <span className="text-red-500">*</span>
                  </label>
                  {!isCustomTimeline ? (
                    <select
                      id="timeline"
                      value={formData.timeline}
                      onChange={e => {
                        if (e.target.value === 'custom') {
                          setIsCustomTimeline(true);
                          setField('timeline', '');
                        } else {
                          setField('timeline', e.target.value);
                        }
                      }}
                      className={`${selectCls} ${errors.timeline ? 'border-red-400' : ''}`}
                    >
                      <option value="">Select timeline...</option>
                      {TIMELINE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                      <option value="custom">Custom Timeline...</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="e.g. 18 Months, 4 Weeks"
                        value={formData.timeline}
                        onChange={e => setField('timeline', e.target.value)}
                        className={`${inputCls} ${errors.timeline ? 'border-red-400 focus:ring-red-400' : ''}`}
                        autoFocus
                      />
                      <button type="button" onClick={() => { setIsCustomTimeline(false); setField('timeline', ''); }} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                    </div>
                  )}
                  {errors.timeline && <p className={errorCls}>{errors.timeline}</p>}
                </div>
              </div>
            )}
          </div>

          {/* ── Section 2: Preferences ── */}
          <div>
            <button type="button" onClick={() => toggleSection('preferences')} className={sectionHeaderCls}>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                <span className="font-bold text-gray-800">Preferences</span>
              </div>
              <span className="text-gray-400 group-hover:text-gray-600 text-xs transition-colors">
                {expandedSections.preferences ? '▲ Hide' : '▼ Show'}
              </span>
            </button>

            {expandedSections.preferences && (
              <div className="space-y-4 pb-4 animate-fadeIn">
                {/* Skills to Learn */}
                <div>
                  <label htmlFor="skillsToLearn" className={labelCls}>
                    Skills to Learn <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <TagInput
                    id="skillsToLearn"
                    tags={formData.skillsToLearn}
                    onAdd={v => addSkill(v)}
                    onRemove={i => removeSkill(i)}
                    placeholder="e.g. React, Kubernetes, Leadership"
                  />
                  <p className="text-xs text-gray-400 mt-1">Press Enter or comma to add a skill</p>
                </div>

                {/* Work Mode */}
                <div>
                  <label className={labelCls}>Work Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    {WORK_MODE_OPTIONS.map(mode => (
                      <button
                        key={mode}
                        type="button"
                        id={`workMode-${mode.toLowerCase().replace(/\s+/g, '-')}`}
                        onClick={() => setField('workMode', mode)}
                        className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                          formData.workMode === mode
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-slate-50 text-gray-600 border-slate-300 hover:border-blue-400 hover:text-blue-600'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 space-y-3">
            {apiError && (
              <div className="p-3 mb-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                ⚠️ {apiError}
              </div>
            )}
            <button
              type="button"
              id="generate-roadmap-btn"
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                isGenerating
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 active:scale-[0.98]'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  Generating Roadmap...
                </>
              ) : (
                <>🗺️ Generate Career Roadmap</>
              )}
            </button>

            <button
              type="button"
              id="reset-roadmap-btn"
              onClick={resetForm}
              className="w-full py-2.5 rounded-xl font-semibold text-sm text-gray-600 hover:text-gray-900 hover:bg-slate-100 border border-slate-200 transition-all"
            >
              ↺ Clear & Reset Form
            </button>
          </div>
        </section>

        {/* RIGHT: Roadmap Visualization */}
        <section className="lg:col-span-7 space-y-6">
          {/* ── Premium Generating Animation ── */}
          {isGenerating && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden min-h-[480px] flex flex-col">
              {/* Gradient header bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 animate-pulse" />

              <div className="flex-1 flex flex-col items-center justify-center p-10 gap-8">

                {/* Orbiting ring + emoji core */}
                <div className="relative flex items-center justify-center w-28 h-28">
                  {/* Outer slow ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-400 border-r-purple-400 animate-spin" style={{ animationDuration: '2s' }} />
                  {/* Middle faster ring */}
                  <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-indigo-400 border-l-violet-400 animate-spin" style={{ animationDuration: '1.3s', animationDirection: 'reverse' }} />
                  {/* Inner pulse */}
                  <div className="absolute inset-5 rounded-full bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 animate-pulse" />
                  <span className="relative text-3xl select-none">🗺️</span>
                </div>

                {/* Title + subtitle */}
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">
                    Building Your Roadmap
                  </h3>
                  <p className="text-sm text-gray-500 max-w-xs">
                    AI is crafting a phase-by-phase plan for{' '}
                    <span className="font-semibold text-blue-600">{formData.targetTitle || 'your role'}</span>
                    {formData.industry && (
                      <> in <span className="font-semibold text-purple-600">{formData.industry}</span></>
                    )}
                  </p>
                </div>

                {/* Step checklist */}
                <div className="w-full max-w-sm space-y-2.5">
                  {[
                    { icon: '🔍', label: `Analyzing ${formData.industry || 'industry'} landscape` },
                    { icon: '🧩', label: `Mapping skills for ${formData.targetTitle || 'target role'}` },
                    { icon: '📅', label: 'Building milestone & activity plan' },
                    { icon: '💰', label: 'Estimating salary progression' },
                  ].map((step, i) => {
                    const isDone = loadingStep > i;
                    const isActive = loadingStep === i;
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-300 ${
                          isDone
                            ? 'bg-green-50 border-green-200'
                            : isActive
                              ? 'bg-blue-50 border-blue-200 shadow-sm'
                              : 'bg-slate-50 border-slate-200 opacity-50'
                        }`}
                      >
                        <span className="text-base shrink-0">
                          {isDone ? '✅' : isActive ? step.icon : '⏳'}
                        </span>
                        <span className={`text-sm font-semibold flex-1 ${
                          isDone ? 'text-green-700' : isActive ? 'text-blue-700' : 'text-gray-400'
                        }`}>
                          {step.label}
                        </span>
                        {isActive && (
                          <span className="flex gap-0.5">
                            {[0, 1, 2].map(d => (
                              <span
                                key={d}
                                className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
                                style={{ animationDelay: `${d * 0.15}s` }}
                              />
                            ))}
                          </span>
                        )}
                        {isDone && (
                          <span className="text-xs font-bold text-green-600">Done</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Progress bar */}
                <div className="w-full max-w-sm space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-gray-400">
                    <span>PROGRESS</span>
                    <span className="text-blue-600">{Math.round(((loadingStep + 1) / 4) * 100)}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 transition-all duration-700 ease-out"
                      style={{ width: `${((loadingStep + 1) / 4) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Skeleton preview of upcoming phases */}
                <div className="w-full max-w-sm space-y-2 opacity-30">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 text-center">Preview</p>
                  {[1, 2, 3].map(n => (
                    <div key={n} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
                      <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-2.5 bg-slate-200 rounded-full animate-pulse" style={{ width: `${70 - n * 10}%` }} />
                        <div className="h-2 bg-slate-100 rounded-full animate-pulse" style={{ width: `${55 - n * 5}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          )}

          {/* Empty State */}
          {!isGenerating && !roadmap && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-12 text-center flex flex-col items-center justify-center min-h-[480px]">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 rounded-2xl flex items-center justify-center text-4xl mb-5 shadow-inner">
                🎯
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Where Do You Want to Go?</h3>
              <p className="text-gray-500 max-w-sm mx-auto mb-6 text-sm leading-relaxed">
                Enter your <strong>target job title</strong>, pick an <strong>industry</strong> and <strong>timeline</strong>, then click{' '}
                <strong>Generate Career Roadmap</strong> to see a personalized path to get there.
              </p>
              <div className="flex flex-col gap-2 w-full max-w-xs">
                {[
                  { icon: '💼', label: 'Senior Software Engineer · Tech · 2 years' },
                  { icon: '📊', label: 'Data Scientist · Finance · 1 year' },
                  { icon: '🎨', label: 'UX Lead · Design · 3 years' },
                ].map(example => (
                  <div
                    key={example.label}
                    className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-gray-500 text-left"
                  >
                    <span className="text-lg">{example.icon}</span>
                    <span>{example.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Roadmap Timeline */}
          {!isGenerating && roadmap && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Path to{' '}
                    <span className="text-blue-600">{formData.targetTitle}</span>
                    {formData.targetCompany && (
                      <span className="text-gray-500 font-semibold"> at {formData.targetCompany}</span>
                    )}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {roadmap.length}-phase plan · {formData.timeline} · {formData.industry} · {formData.workMode}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveRoadmap}
                    disabled={isSaving}
                    className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-lg transition-all disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : saveSuccess ? '✓ Saved!' : '💾 Save Plan'}
                  </button>
                  <button
                    id="copy-roadmap-btn"
                    onClick={handleCopy}
                    className="px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-400 rounded-lg transition-all bg-blue-50"
                  >
                    {copied ? '✓ Copied!' : '📋 Copy Plan'}
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute left-7 top-10 bottom-10 w-0.5 bg-gradient-to-b from-blue-300 via-purple-300 to-teal-300 hidden md:block" />

                <div className="space-y-4">
                  {roadmap.map((phase, index) => {
                    const colorSet = phaseColorMap[phase.color] || PHASE_COLORS[0];
                    const isVisible = visiblePhases.includes(index);
                    const isExpanded = expandedPhases[index] ?? index === 0;

                    return (
                      <div
                        key={phase.phase}
                        className={`transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                      >
                        <div className={`border-2 ${colorSet.border} ${colorSet.bg} rounded-2xl overflow-hidden`}>
                          <button
                            type="button"
                            onClick={() => togglePhase(index)}
                            className="w-full flex items-center gap-4 p-5 text-left hover:brightness-[0.97] transition-all"
                          >
                            <div className={`w-12 h-12 rounded-full ${colorSet.light} text-white flex items-center justify-center text-lg font-extrabold shrink-0 shadow-md`}>
                              {phase.phase}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-xs font-bold uppercase tracking-widest ${colorSet.text}`}>
                                  Phase {phase.phase}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${colorSet.badge}`}>
                                  {phase.duration}
                                </span>
                              </div>
                              <h3 className="font-bold text-gray-900 text-base mt-0.5 truncate">{phase.title}</h3>
                            </div>

                            <span className={`${colorSet.text} text-sm ml-2 shrink-0`}>
                              {isExpanded ? '▲' : '▼'}
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="px-5 pb-5 space-y-5 border-t border-white/50 pt-4 animate-fadeIn">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="sm:col-span-3">
                                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Key Activities</h4>
                                  <ul className="space-y-1.5">
                                    {phase.activities.map((activity, i) => (
                                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                        <span className={`shrink-0 w-4 h-4 mt-0.5 rounded-full ${colorSet.light} text-white text-[9px] flex items-center justify-center font-bold`}>
                                          {i + 1}
                                        </span>
                                        {activity}
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div>
                                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Skills to Acquire</h4>
                                  <div className="flex flex-wrap gap-1.5">
                                    {phase.skills.map((skill, i) => (
                                      <span key={i} className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colorSet.badge}`}>
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                <div className="sm:col-span-2">
                                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Phase Milestones</h4>
                                  <ul className="space-y-1.5">
                                    {phase.milestones.map((milestone, i) => (
                                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                        <span className="text-teal-600 font-bold shrink-0 mt-0.5">✓</span>
                                        {milestone}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 min-h-[400px]">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Your Saved Roadmaps</h3>
          {isLoadingSaved ? (
            <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
          ) : savedRoadmaps.length === 0 ? (
            <p className="text-gray-500 text-center py-10">No saved roadmaps found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedRoadmaps.map((plan: any) => (
                <button
                  key={plan.id}
                  onClick={() => {
                    setFormData({
                      targetTitle: plan.targetTitle,
                      targetCompany: plan.targetCompany || '',
                      timeline: plan.timeline,
                      industry: plan.industry,
                      skillsToLearn: plan.skillsToLearn || [],
                      workMode: plan.workMode || 'Hybrid',
                    });
                    setRoadmap(plan.roadmapData);
                    setExpandedPhases(Object.fromEntries((plan.roadmapData || []).map((_: any, i: number) => [i, i === 0])));
                    setViewMode('generate');
                  }}
                  className="text-left p-5 border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all bg-slate-50"
                >
                  <h4 className="font-bold text-gray-900 mb-1">{plan.targetTitle}</h4>
                  <p className="text-xs text-gray-500 mb-3">{plan.industry} · {plan.timeline}</p>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                    {plan.roadmapData?.length || 0} Phases
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
