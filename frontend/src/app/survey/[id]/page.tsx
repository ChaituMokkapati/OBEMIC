'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { studentService } from '@/services/student.service';
import './survey.css';

export default function SurveyPage() {
  const router = useRouter();
  const params = useParams();
  const targetSurveyId = params.id as string;

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Login State
  const [rollNumber, setRollNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Survey State
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [surveyDetails, setSurveyDetails] = useState<any>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    // Check if logged in initially
    if (studentService.isAuthenticated()) {
      setIsAuthenticated(true);
      fetchSubjects();
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      await studentService.login(rollNumber, password);
      setIsAuthenticated(true);
      fetchSubjects();
    } catch (err: any) {
      setLoginError(err.message || 'Invalid roll number or password');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    studentService.logout();
    setIsAuthenticated(false);
    setDashboardData(null);
    setSelectedAssignmentId(null);
    setSurveyDetails(null);
  };

  const fetchSubjects = async () => {
    setIsLoadingSubjects(true);
    try {
      const data: any = await studentService.getSubjects();
      // data should have { survey: { id, title }, pendingSubjects: [] }
      if (data && data.pendingSubjects) {
        setDashboardData(data);
        if (data.pendingSubjects.length === 0) {
          setIsCompleted(true);
        }
      } else {
        setDashboardData(null); // No active surveys
      }
    } catch (err: any) {
      console.error(err);
      if (err.message.includes('401')) {
        handleLogout();
      }
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  const selectSubject = async (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId);
    setSurveyDetails(null);
    setRatings({});
    setSubmitError('');
    try {
      const details = await studentService.getSurveyDetails(assignmentId);
      setSurveyDetails(details);
      // Initialize ratings
      const initRatings: Record<string, number> = {};
      details.courseOutcomes.forEach((co: any) => {
        initRatings[co.id] = 0;
      });
      setRatings(initRatings);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleRatingChange = (coId: string, value: number) => {
    setRatings(prev => ({ ...prev, [coId]: value }));
  };

  const handleSubmit = async () => {
    const missing = Object.values(ratings).some(val => val === 0);
    if (missing) {
      setSubmitError('Please provide a rating for all Course Outcomes before submitting.');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const payload = Object.keys(ratings).map(coId => ({
        courseOutcomeId: coId,
        rating: ratings[coId]
      }));
      await studentService.submitSurvey(selectedAssignmentId!, payload);
      alert('Survey submitted successfully!');
      setSelectedAssignmentId(null);
      fetchSubjects(); // refresh pending subjects
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit survey');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRateLabel = (v: number) => {
    switch (v) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return '';
    }
  };

  return (
    <div className="survey-nexus">
      <div className="shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Top Bar */}
        <nav className="topbar">
          <div className="topbar-brand">
            <div className="topbar-logo">🎓</div>
            <div>
              <div className="topbar-title">Survey Nexus</div>
              <div className="topbar-sub">Academic Feedback Platform</div>
            </div>
          </div>
          <div className="topbar-right">
            {isAuthenticated && (
              <button className="btn btn-rose btn-sm" onClick={handleLogout}>🚪 Logout</button>
            )}
          </div>
        </nav>

        <main className="main">

          {!isAuthenticated && (
            <div className="pg on" id="pgLogin">
              <div className="login-center">
                <div className="login-card">
                  <div className="login-icon">🎓</div>
                  <h2>Student Portal</h2>
                  <p className="sub">Enter your credentials to participate in the course survey</p>
                  <form onSubmit={handleLogin}>
                    {loginError && (
                      <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '8px', fontSize: '0.9rem' }}>
                        {loginError}
                      </div>
                    )}
                    <div className="field">
                      <label className="field-label" htmlFor="sRoll">Roll Number</label>
                      <input type="text" id="sRoll" className="field-input" placeholder="Enter your roll number" required autoComplete="off" value={rollNumber} onChange={(e)=>setRollNumber(e.target.value)} />
                    </div>
                    <div className="field">
                      <label className="field-label" htmlFor="sPass">Password</label>
                      <input type="password" id="sPass" className="field-input" placeholder="Enter your password" required value={password} onChange={(e)=>setPassword(e.target.value)} />
                    </div>
                    <button type="submit" className="btn btn-violet btn-full btn-lg mt-sm" disabled={isLoggingIn}>
                      {isLoggingIn ? 'Authenticating...' : '🚀 Enter Survey'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {isAuthenticated && !dashboardData && !isLoadingSubjects && (
            <div className="pg on" id="pgClosed">
              <div className="login-center">
                <div className="login-card msg-screen">
                  <div className="msg-ico lock">🔒</div>
                  <h2>Survey Not Available</h2>
                  <p>The course outcome survey is currently closed. Please contact your faculty for more information.</p>
                </div>
              </div>
            </div>
          )}

          {isAuthenticated && dashboardData && isCompleted && !selectedAssignmentId && (
            <div className="pg on">
              <div className="login-center">
                <div className="login-card msg-screen">
                  <div className="msg-ico lock" style={{ background: '#e7faf0', color: '#10b981' }}>✅</div>
                  <h2>All Caught Up!</h2>
                  <p>You have successfully submitted surveys for all your pending subjects.</p>
                </div>
              </div>
            </div>
          )}

          {isAuthenticated && dashboardData && !isCompleted && !selectedAssignmentId && (
            <div className="pg on" id="pgSubjects">
              <div id="subjSelect">
                <div className="dash-head">
                  <h2>Select a Subject</h2>
                  <p>You have {dashboardData.pendingSubjects.length} pending survey(s) to complete.</p>
                </div>
                <div className="subj-grid">
                  {dashboardData.pendingSubjects.map((sub: any, i: number) => (
                    <div key={sub.facultyAssignmentId} className="subj-tile" onClick={() => selectSubject(sub.facultyAssignmentId)}>
                      <div className="tile-top">
                        <div className={`chip s${i % 8}`}>{sub.subjectCode}</div>
                        <div>
                          <h3>{sub.subjectCode}</h3>
                          <div className="tile-meta">{sub.subjectName}</div>
                        </div>
                      </div>
                      <div className="tile-desc">Course Outcomes to review</div>
                      <div className="tile-arrow">➔</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {isAuthenticated && selectedAssignmentId && surveyDetails && (
            <div className="pg on" id="pgCOForm">
              <div className="sv-form">
                <button className="btn btn-outline mb-lg" onClick={() => setSelectedAssignmentId(null)}>← Back to Subjects</button>

                <div className="sv-form-head">
                  <div className="chip s0">{surveyDetails.subjectCode}</div>
                  <div>
                    <h3>{surveyDetails.subjectCode} - {surveyDetails.subjectName}</h3>
                  </div>
                </div>

                {surveyDetails.courseOutcomes.map((co: any) => {
                  const curVal = ratings[co.id];
                  const isRated = !!curVal;
                  return (
                    <div key={co.id} className={`sv-co ${isRated ? 'done' : ''}`}>
                      <div className="sv-co-head">
                        <div className="left">
                          <span className="co-tag">{co.coCode}</span>
                          <h4>{co.description}</h4>
                        </div>
                        {isRated && <div className="done-badge">✓ Rated</div>}
                      </div>
                      <div className="ratings">
                        {[1, 2, 3, 4, 5].map(v => (
                          <label key={v} className="rate-opt" data-v={v}>
                            <input 
                              type="radio" 
                              name={`r_${co.id}`} 
                              value={v} 
                              checked={curVal === v} 
                              onChange={() => handleRatingChange(co.id, v)} 
                            />
                            <div className="rate-face">
                              <span className="num">{v}</span>
                              <span className="lbl">{getRateLabel(v)}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {submitError && (
                  <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '8px' }}>
                    {submitError}
                  </div>
                )}

                <button 
                  className="btn btn-emerald btn-lg btn-full" 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : '✅ Submit Survey'}
                </button>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
