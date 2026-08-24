'use client';

import { useUser } from '@clerk/nextjs';
import { useState } from 'react';

interface Experience {
  id: string;
  company: string;
  position: string;
  duration: string;
  description: string;
}

interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  year: string;
}

export default function ResumeGenerator() {
  const { user, isLoaded } = useUser();
  const [skillInput, setSkillInput] = useState('');

  const [formData, setFormData] = useState({
    fullName: user?.firstName || '',
    profession: '',
    email: user?.emailAddresses[0]?.emailAddress || '',
    phone: '',
    location: '',
    summary: '',
    experience: [] as Experience[],
    education: [] as Education[],
    skills: [] as string[],
  });

  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    summary: false,
    experience: false,
    education: false,
    skills: false,
  });

  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState(false);
  const [draftsList, setDraftsList] = useState<any[]>([]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const updateExperience = (id: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.map(exp =>
        exp.id === id ? { ...exp, [field]: value } : exp
      ),
    }));
  };

  const removeExperience = (id: string) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id),
    }));
  };

  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: [
        ...prev.experience,
        { id: Date.now().toString(), company: '', position: '', duration: '', description: '' },
      ],
    }));
  };


  const addSkill = () => {
    if (skillInput.trim()) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()],
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== idx),
    }));
  };

  const handleLoadDraft = async () => {
    try {
      const button = document.querySelector('[data-action="load-draft"]') as HTMLButtonElement;
      if (button) {
        button.disabled = true;
        button.textContent = 'Loading...';
      }

      const res = await fetch('/api/resumes/get');
      if (!res.ok) throw new Error('Failed to fetch drafts');

      const data = await res.json();

      if (!data.resumes || data.resumes.length === 0) {
        alert('No saved drafts found.');
        return;
      }

      setDraftsList(data.resumes.reverse()); // Show newest first
      setIsDraftsModalOpen(true);
    } catch (error) {
      console.error('Error loading draft:', error);
      alert(`❌ Failed to load draft: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      const button = document.querySelector('[data-action="load-draft"]') as HTMLButtonElement;
      if (button) {
        button.disabled = false;
        button.textContent = '📂 Load Draft';
      }
    }
  };

  const loadSpecificDraft = (draft: any) => {
    setFormData({
      fullName: draft.fullName || '',
      profession: draft.profession || '',
      email: draft.email || '',
      phone: draft.phone || '',
      location: draft.location || '',
      summary: draft.summary || '',
      experience: draft.experience || [],
      education: draft.education || [],
      skills: draft.skills || [],
    });

    setExpandedSections({ personal: true, summary: true, experience: true, education: true, skills: true });
    setIsDraftsModalOpen(false);
    alert(`✅ Draft loaded!`);
  };

  const handleDeleteDraft = async (id: number) => {
    if (!confirm('Are you sure you want to delete this draft?')) return;

    try {
      const res = await fetch('/api/resumes/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: id }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete');
      }

      // Remove from list
      setDraftsList((prev) => prev.filter((d) => d.id !== id));
      alert('✅ Draft deleted successfully');
    } catch (error) {
      console.error('Error deleting draft:', error);
      alert(`❌ Failed to delete draft: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSaveDraft = async () => {
    try {
      // Show loading state on button
      const button = document.querySelector('[data-action="save-draft"]') as HTMLButtonElement;
      if (button) {
        button.disabled = true;
        button.textContent = 'Saving...';
      }

      // Validate required fields
      if (!formData.fullName || !formData.email) {
        alert('Please fill in at least Full Name and Email before saving');
        if (button) {
          button.disabled = false;
          button.textContent = 'Save Draft';
        }
        return;
      }

      // Send resume data to API
      const response = await fetch('/api/resumes/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          profession: formData.profession,
          email: formData.email,
          phone: formData.phone,
          location: formData.location,
          summary: formData.summary,
          experience: formData.experience,
          education: formData.education,
          skills: formData.skills,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save resume');
      }

      const data = await response.json();

      // Show success message with resume ID
      alert(`✅ Resume saved successfully! (ID: ${data.resumeId})`);
    } catch (error) {
      console.error('Error saving resume:', error);
      alert(`❌ Failed to save resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Reset button state
      const button = document.querySelector('[data-action="save-draft"]') as HTMLButtonElement;
      if (button) {
        button.disabled = false;
        button.textContent = '💾 Save Draft';
      }
    }
  };

  const handleDownloadPDF = async () => {
    try {
      // Show loading state on button
      const button = document.querySelector('[data-action="download-pdf"]') as HTMLButtonElement;
      if (button) {
        button.disabled = true;
        button.textContent = 'Generating...';
      }

      // Validate form data
      if (!formData.fullName || !formData.email) {
        alert('Please fill in at least Full Name and Email before downloading');
        if (button) {
          button.disabled = false;
          button.textContent = 'Download PDF';
        }
        return;
      }

      // Send resume data to API
      const response = await fetch('/api/resumes/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          profession: formData.profession,
          email: formData.email,
          phone: formData.phone,
          location: formData.location,
          summary: formData.summary,
          experience: formData.experience,
          skills: formData.skills,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate PDF');
      }

      // Get PDF blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${formData.fullName.replace(/\s+/g, '_')}_resume.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Show success message
      alert('✅ Resume downloaded successfully!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert(`❌ Failed to download PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Reset button state
      const button = document.querySelector('[data-action="download-pdf"]') as HTMLButtonElement;
      if (button) {
        button.disabled = false;
        button.textContent = '📥 Download PDF';
      }
    }
  };

  const hasNoData =
    !formData.profession.trim() &&
    !formData.phone.trim() &&
    !formData.location.trim() &&
    !formData.summary.trim() &&
    formData.experience.length === 0 &&
    formData.skills.length === 0;

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="mb-4">
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Resume Generator</h2>
        <p className="text-gray-600 text-sm mt-1">Create a professional resume in minutes using European standard CV guidelines.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT PANEL: FORM */}
        <div className="space-y-4">
          {/* Personal Info Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
            <button
              onClick={() => toggleSection('personal')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50/50 transition-all duration-200"
            >
              <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
              <span className={`transform transition-transform duration-300 ${expandedSections.personal ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {expandedSections.personal && (
              <div className="px-6 pb-6 space-y-4 border-t border-gray-100 pt-4">
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-gray-900 placeholder-gray-400"
                />
                <input
                  type="text"
                  name="profession"
                  placeholder="Profession / Job Title (e.g. Senior Software Engineer)"
                  value={formData.profession}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-gray-900 placeholder-gray-400"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-gray-900 placeholder-gray-400"
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-gray-900 placeholder-gray-400"
                />
                <input
                  type="text"
                  name="location"
                  placeholder="Location (City, Country)"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-gray-900 placeholder-gray-400"
                />
              </div>
            )}
          </div>

          {/* Professional Summary Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
            <button
              onClick={() => toggleSection('summary')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-purple-50/50 transition-all duration-200"
            >
              <h2 className="text-lg font-semibold text-gray-900">Professional Summary</h2>
              <span className={`transform transition-transform duration-300 ${expandedSections.summary ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {expandedSections.summary && (
              <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                <textarea
                  name="summary"
                  placeholder="Write a brief summary about yourself..."
                  value={formData.summary}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all duration-200 outline-none text-gray-900 placeholder-gray-400 resize-none"
                />
                <p className="text-sm text-gray-500 mt-2">{formData.summary.length}/500 characters</p>
              </div>
            )}
          </div>

          {/* Experience Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
            <button
              onClick={() => toggleSection('experience')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-teal-50/50 transition-all duration-200"
            >
              <h2 className="text-lg font-semibold text-gray-900">Experience</h2>
              <span className={`transform transition-transform duration-300 ${expandedSections.experience ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {expandedSections.experience && (
              <div className="px-6 pb-6 border-t border-gray-100 pt-4 space-y-4">
                {formData.experience.map(exp => (
                  <div key={exp.id} className="p-4 bg-gray-50 rounded-lg space-y-3 border-l-4 border-teal-500">
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-teal-500 outline-none text-gray-900 placeholder-gray-400 transition-all duration-200"
                    />
                    <input
                      type="text"
                      placeholder="Job Title"
                      value={exp.position}
                      onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-teal-500 outline-none text-gray-900 placeholder-gray-400 transition-all duration-200"
                    />
                    <input
                      type="text"
                      placeholder="Duration (e.g., Jan 2020 - Present)"
                      value={exp.duration}
                      onChange={(e) => updateExperience(exp.id, 'duration', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-teal-500 outline-none text-gray-900 placeholder-gray-400 transition-all duration-200"
                    />
                    <textarea
                      placeholder="Job description..."
                      value={exp.description}
                      onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-teal-500 outline-none text-gray-900 placeholder-gray-400 transition-all duration-200 resize-none"
                    />
                    <button
                      onClick={() => removeExperience(exp.id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors duration-200"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={addExperience}
                  className="w-full py-2 border border-dashed border-teal-500 text-teal-600 rounded-lg hover:bg-teal-50 transition-all duration-200 font-medium"
                >
                  + Add Experience
                </button>
              </div>
            )}
          </div>

          {/* Skills Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
            <button
              onClick={() => toggleSection('skills')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50/50 transition-all duration-200"
            >
              <h2 className="text-lg font-semibold text-gray-900">Skills</h2>
              <span className={`transform transition-transform duration-300 ${expandedSections.skills ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {expandedSections.skills && (
              <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  {formData.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-blue-200 transition-all duration-200"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(idx)}
                        className="cursor-pointer hover:text-blue-900 transition-colors duration-200"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a skill"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addSkill();
                      }
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none text-gray-900 placeholder-gray-400"
                  />
                  <button
                    onClick={addSkill}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition-all duration-200 font-medium"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Load Draft - full width */}
            <button
              data-action="load-draft"
              onClick={handleLoadDraft}
              className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-200 active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
            >
              📂 Load Draft
            </button>
            {/* Save Draft + Download PDF side by side */}
            <div className="flex gap-3">
              <button
                data-action="save-draft"
                onClick={handleSaveDraft}
                className="flex-1 bg-white border border-blue-600 text-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50 active:scale-95 transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                💾 Save Draft
              </button>
              <button
                data-action="download-pdf"
                onClick={handleDownloadPDF}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 active:scale-95 transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📥 Download PDF
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: EUROPEAN CV PREVIEW OR EMPTY STATE */}
        <div className="h-fit">
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
            {hasNoData ? (
              <div className="p-12 bg-white space-y-6 min-h-[600px] flex flex-col items-center justify-center text-center animate-fadeIn">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-inner border border-blue-100">
                  📄
                </div>
                <h3 className="text-xl font-bold text-gray-900">Ready to Generate Resume</h3>
                <p className="text-gray-500 max-w-sm text-sm leading-relaxed">
                  Fill out your professional details, summary, experience, and skills in the form. We will dynamically compile a clean European standard CV preview.
                </p>
                <button
                  onClick={() => {
                    setExpandedSections(prev => ({ ...prev, personal: true }));
                    const nameInput = document.getElementsByName('fullName')[0] as HTMLInputElement;
                    if (nameInput) {
                      nameInput.focus();
                    }
                  }}
                  className="px-6 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  Get Started
                </button>
              </div>
            ) : (
              /* Resume Preview - European Standard */
              <div className="p-10 bg-white space-y-6 min-h-[600px] overflow-y-auto animate-fadeIn">
                {/* Header - European Style */}
                <div className="text-center border-b-2 border-blue-600 pb-4">
                  <h1 className="text-4xl font-bold text-gray-900">{formData.fullName || 'Your Name'}</h1>
                  {formData.profession && (
                    <p className="text-lg font-semibold text-blue-600 mt-1">{formData.profession}</p>
                  )}
                  <div className="flex justify-center gap-4 text-sm text-gray-600 mt-2">
                    {formData.email && <p>📧 {formData.email}</p>}
                    {formData.phone && <p>📱 {formData.phone}</p>}
                    {formData.location && <p>📍 {formData.location}</p>}
                  </div>
                </div>

                {/* Summary */}
                {formData.summary && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2 border-l-4 border-blue-600 pl-3">Professional Profile</h2>
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{formData.summary}</p>
                  </div>
                )}

                {/* Experience Preview */}
                {formData.experience.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-blue-600 pl-3">Professional Experience</h2>
                    <div className="space-y-5">
                      {formData.experience.map(exp => (
                        <div key={exp.id} className="border-l-2 border-gray-300 pl-4">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="font-bold text-gray-900">{exp.position || 'Position'}</h3>
                            <span className="text-gray-600 text-sm">{exp.duration}</span>
                          </div>
                          <p className="text-gray-700 font-semibold text-sm mb-2">{exp.company}</p>
                          {exp.description && <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{exp.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills Preview */}
                {formData.skills.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-3 border-l-4 border-blue-600 pl-3">Skills</h2>
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="bg-blue-100 text-blue-900 px-3 py-1 rounded-md text-xs font-semibold"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drafts Modal */}
      {isDraftsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900">Your Saved Drafts</h3>
              <button 
                onClick={() => setIsDraftsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-white">
              {draftsList.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No drafts remaining.</p>
              ) : (
                draftsList.map((draft) => (
                  <div key={draft.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{draft.fullName || 'Untitled'}</h4>
                      {draft.profession && <p className="text-sm text-blue-600 font-medium">{draft.profession}</p>}
                      <p className="text-xs text-gray-400 mt-1">Saved: {new Date(draft.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleDeleteDraft(draft.id)}
                        className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200 font-medium"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => loadSpecificDraft(draft)}
                        className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                      >
                        Load
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
