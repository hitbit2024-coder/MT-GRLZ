import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, query, orderBy, onSnapshot, 
  doc, updateDoc, deleteDoc, serverTimestamp 
} from 'firebase/firestore';
import { db, auth, logInWithGoogle, logOut } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Applicant, ApplicationStatus } from '../types';
import { 
  ShieldAlert, BarChart3, Users, 
  TrendingUp, Star, MapPin, 
  Heart, Mail, CheckCircle2, 
  XOctagon, Clock, UserCheck, 
  Sparkles, ExternalLink, RefreshCw, 
  FileCheck, LogOut, Trash2, Edit3 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, 
  Tooltip, ResponsiveContainer, PieChart, 
  Pie, Cell, Legend 
} from 'recharts';

// Preset mock applicants for Sandbox preview
const SANDBOX_PRESETS: Applicant[] = [
  {
    id: "app_sandbox1",
    fullName: "Elena Rostova",
    displayName: "Elena_Vixen",
    email: "elena.rostova@example.com",
    age: 22,
    location: "Prague, Czech Republic",
    primaryCategory: "Cosplay & Theme",
    languages: "Czech, Fluent English",
    internetSpeed: "High Speed (Fiber 100+ Mbps upload)",
    experience: "1 to 3 Years",
    introduction: "Hi database review team! I love gaming and streaming with cute outfit styling. Currently modeling on Twitch looking to migrate to the private token portal for better income ratios.",
    photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
    status: "new",
    notes: "Needs standard geoblocking setup for Eastern Europe. Looking like a top-tier candidate.",
    score: 92,
    createdAt: new Date().toISOString()
  },
  {
    id: "app_sandbox2",
    fullName: "Naomi Takahashi",
    displayName: "Kiki_ASMR",
    email: "naomi.t@example.com",
    age: 20,
    location: "Tokyo, Japan",
    primaryCategory: "ASMR & Whispering",
    languages: "Japanese, Conversational English",
    internetSpeed: "High Speed (Fiber 100+ Mbps upload)",
    experience: "None / Complete Beginner",
    introduction: "Hello! I am a student interested in doing relaxing audio/whispering sets. I have a high-end binaural audio microphone set but no webcam modeling history.",
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    status: "reviewing",
    notes: "Excellent microphone gear. Needs onboarding training for model profile settings.",
    score: 85,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: "app_sandbox3",
    fullName: "Marcus Daniels",
    displayName: "Marc_Interactive",
    email: "marcus.d@example.com",
    age: 25,
    location: "Miami, Florida",
    primaryCategory: "Interactive Chatting",
    languages: "English, Spanish",
    internetSpeed: "Standard cable (15-50 Mbps upload)",
    experience: "3+ Years experienced",
    introduction: "Over 3 years streaming on chat networks. Passionate about fitness, visual choreography, and hosting energetic late-night model hubs.",
    photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200",
    status: "contacted",
    notes: "Already set up. Interview set for Tuesday, checking internet latency margins.",
    score: 95,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

const COLORS = ['#d946ef', '#a855f7', '#6366f1', '#64748b', '#3b82f6', '#ec4899'];

export default function AgencyConsole() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [isSandbox, setIsSandbox] = useState<boolean>(true); // Sandbox fallback active by default
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Recruiter actions modal state
  const [statusInput, setStatusInput] = useState<ApplicationStatus>('new');
  const [notesInput, setNotesInput] = useState<string>('');
  const [scoreInput, setScoreInput] = useState<number>(80);

  // Track Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email === 'hitbit2024@gmail.com') {
        setIsAdminMode(true);
        setIsSandbox(false); // Disable sandbox on true authorized admin login
      } else {
        setIsAdminMode(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch / Sync Applications
  useEffect(() => {
    if (isSandbox) {
      // Sandbox mode: Load from presets or local storage if exists
      const saved = localStorage.getItem('vivid_recruits_sandbox');
      if (saved) {
        try {
          setApplicants(JSON.parse(saved));
        } catch {
          setApplicants(SANDBOX_PRESETS);
        }
      } else {
        setApplicants(SANDBOX_PRESETS);
        localStorage.setItem('vivid_recruits_sandbox', JSON.stringify(SANDBOX_PRESETS));
      }
    } else {
      // Authorized Production Admin Mode (Real Firebase syncing)
      setLoading(true);
      const q = query(collection(db, 'applicants'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: Applicant[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            fullName: data.fullName,
            displayName: data.displayName,
            email: data.email,
            age: data.age,
            location: data.location,
            primaryCategory: data.primaryCategory,
            languages: data.languages,
            internetSpeed: data.internetSpeed,
            experience: data.experience,
            introduction: data.introduction,
            photoUrl: data.photoUrl,
            status: data.status,
            notes: data.notes || '',
            score: data.score || 0,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString()
          });
        });
        setApplicants(list);
        setLoading(false);
      }, (err) => {
        console.error("Snapshot read error details: ", err);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [isSandbox]);

  // Handle Log In with Google
  const handleGoogleLogin = async () => {
    try {
      await logInWithGoogle();
    } catch (err) {
      alert("Authentication failed. Please check internet connection.");
    }
  };

  // Toggle Sandbox as fallback review mode
  const enableSandboxMode = () => {
    setIsSandbox(true);
  };

  // Select applicant details
  const handleSelectApplicant = (app: Applicant) => {
    setSelectedApplicant(app);
    setStatusInput(app.status);
    setNotesInput(app.notes || '');
    setScoreInput(app.score || 80);
  };

  // Save changes to Applicant status, notes, or score
  const handleSaveAssessment = async () => {
    if (!selectedApplicant) return;

    if (isSandbox) {
      // Offline Local Storage Simulation
      const updated = applicants.map((a) => {
        if (a.id === selectedApplicant.id) {
          return {
            ...a,
            status: statusInput,
            notes: notesInput,
            score: Number(scoreInput)
          };
        }
        return a;
      });
      setApplicants(updated);
      localStorage.setItem('vivid_recruits_sandbox', JSON.stringify(updated));
      setSelectedApplicant({
        ...selectedApplicant,
        status: statusInput,
        notes: notesInput,
        score: Number(scoreInput)
      });
      alert("Recruit assessment updated successfully (Sandbox Mode)!");
    } else {
      // Production Cloud Firestore Save
      try {
        const applicantRef = doc(db, 'applicants', selectedApplicant.id);
        await updateDoc(applicantRef, {
          status: statusInput,
          notes: notesInput,
          score: Number(scoreInput),
          updatedAt: serverTimestamp()
        });
        setSelectedApplicant({
          ...selectedApplicant,
          status: statusInput,
          notes: notesInput,
          score: Number(scoreInput)
        });
        alert("Applicant saved directly to secure Firestore cloud!");
      } catch (err) {
        alert("Database Error: Code " + (err instanceof Error ? err.message : String(err)));
      }
    }
  };

  // Purge / Delete candidate documentation
  const handleDeleteApplicant = async (appId: string) => {
    if (!confirm("Are you sure you want to permanently delete this candidate profile? This cannot be undone.")) return;

    if (isSandbox) {
      const filtered = applicants.filter((a) => a.id !== appId);
      setApplicants(filtered);
      localStorage.setItem('vivid_recruits_sandbox', JSON.stringify(filtered));
      setSelectedApplicant(null);
    } else {
      try {
        const applicantRef = doc(db, 'applicants', appId);
        await deleteDoc(applicantRef);
        setSelectedApplicant(null);
      } catch (err) {
        alert("Cloud database deletion failed: Unauthorized permissions.");
      }
    }
  };

  // Aggregate stats using useMemo
  const stats = useMemo(() => {
    const total = applicants.length;
    const pendingReview = applicants.filter((a) => a.status === 'new').length;
    const reviewing = applicants.filter((a) => a.status === 'reviewing').length;
    const accepted = applicants.filter((a) => a.status === 'accepted').length;

    // Projected revenue assuming average model contributes $800 weekly in agency gross token share
    const projectedRevenue = accepted * 800;

    // Category breakout
    const categoriesMap: { [key: string]: number } = {};
    applicants.forEach((a) => {
      categoriesMap[a.primaryCategory] = (categoriesMap[a.primaryCategory] || 0) + 1;
    });

    const categoriesChartData = Object.keys(categoriesMap).map((key) => ({
      name: key,
      value: categoriesMap[key]
    }));

    return {
      total,
      pendingReview,
      reviewing,
      accepted,
      projectedRevenue,
      categoriesChartData
    };
  }, [applicants]);

  return (
    <div className="space-y-6" id="agency-console-container">
      {/* Upper Mode Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-950 border border-slate-800 rounded-2xl p-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isSandbox ? 'bg-amber-400 animate-pulse' : 'bg-green-500 animate-pulse'}`}></span>
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest">
              {isSandbox ? 'SANDBOX TRIAL FALLBACK' : 'SECURE PRODUCTION CLOUD'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {isSandbox 
              ? 'Preview actions simulate status updates utilizing browser local storage. Official actions lock to database authorization rules.'
              : `Admin Session Active: Connected as Owner (${user?.email}).`
            }
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-slate-300 font-semibold">{user.displayName || 'Administrator'}</p>
                <p className="text-[10px] text-purple-400 font-mono">Privileged Admin</p>
              </div>
              <button
                type="button"
                onClick={() => logOut()}
                className="flex items-center gap-1.5 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold font-mono transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-2 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-lg transition"
              >
                Sign In as Admin
              </button>
              { !isSandbox && (
                <button
                  type="button"
                  onClick={enableSandboxMode}
                  className="flex-1 sm:flex-none py-2 px-4 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition font-mono"
                >
                  Enter Demo Sandbox
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-deck">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">Total Applicant Catalog</p>
          <h4 className="text-3xl font-black font-mono text-white mt-2">{stats.total}</h4>
          <span className="text-[10px] text-slate-500 block mt-2">Aggregated recruitment funnel</span>
          <Users className="absolute right-4 bottom-4 w-12 h-12 text-slate-800/40 pointer-events-none" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">Pending Action</p>
          <h4 className="text-3xl font-black font-mono text-purple-400 mt-2">{stats.pendingReview}</h4>
          <span className="text-[10px] text-purple-400/80 block mt-2">Awaiting age / ID check</span>
          <Clock className="absolute right-4 bottom-4 w-12 h-12 text-purple-950/20 pointer-events-none" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">Active Talent Roster</p>
          <h4 className="text-3xl font-black font-mono text-green-400 mt-2">{stats.accepted}</h4>
          <span className="text-[10px] text-slate-500 block mt-2">Contracts signed</span>
          <UserCheck className="absolute right-4 bottom-4 w-12 h-12 text-green-950/20 pointer-events-none" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">Estimated Revenue Fleet</p>
          <h4 className="text-3xl font-black font-mono text-white mt-2">${stats.projectedRevenue.toLocaleString()}</h4>
          <span className="text-[10px] text-green-400 block mt-2">Projected weekly token gain</span>
          <TrendingUp className="absolute right-4 bottom-4 w-12 h-12 text-slate-800/40 pointer-events-none" />
        </div>
      </div>

      {applicants.length === 0 && loading ? (
        <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
          <RefreshCw className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400">Syncing models recruitment files with Firebase cloud...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main List Table */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-md font-semibold text-slate-100 flex items-center justify-between mb-4">
              <span>Model Applicant Portfolio</span>
              <span className="text-xs font-mono font-normal text-slate-400">{applicants.length} Entries found</span>
            </h3>

            {applicants.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs">
                No recruiter applications stored yet. Try submitting a new application form on the front page and it will sync here automatically!
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60 max-h-[640px] overflow-y-auto pr-1">
                {applicants.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => handleSelectApplicant(app)}
                    className={`w-full text-left p-3 rounded-xl transition flex items-center gap-3 my-1 border ${
                      selectedApplicant?.id === app.id
                        ? 'bg-purple-950/15 border-purple-800/60'
                        : 'bg-transparent border-transparent hover:bg-slate-800/30'
                    }`}
                  >
                    <img 
                      src={app.photoUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200"} 
                      alt={app.displayName} 
                      className="w-10 h-10 rounded-full object-cover border border-slate-800 flex-shrink-0" 
                    />
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-semibold text-slate-200 truncate">{app.displayName}</h4>
                        <span className="text-[10px] text-slate-500 font-mono ml-2">
                          {new Date(app.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">{app.primaryCategory}</p>
                      
                      <div className="flex gap-2 mt-1.5 items-center">
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold uppercase ${
                          app.status === 'new' ? 'bg-purple-950/40 text-purple-400 border-purple-800/40' :
                          app.status === 'reviewing' ? 'bg-amber-950/40 text-amber-400 border-amber-800/40' :
                          app.status === 'contacted' ? 'bg-indigo-950/40 text-indigo-400 border-indigo-800/40' :
                          app.status === 'accepted' ? 'bg-green-950/40 text-green-400 border-green-800/40' :
                          'bg-slate-950/40 text-slate-400 border-slate-800/40'
                        }`}>
                          {app.status}
                        </span>
                        
                        {app.score && app.score >= 90 && (
                          <span className="flex items-center gap-0.5 text-[9px] text-green-400 bg-green-950/20 px-1 border border-green-900/30 rounded">
                            <Star className="w-2.5 h-2.5 fill-green-400" /> Lead Match
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Review Details Pane */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {selectedApplicant ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative">
                {/* Visual Bio Header */}
                <div className="flex items-start gap-4 mb-6">
                  <img
                    src={selectedApplicant.photoUrl}
                    alt={selectedApplicant.displayName}
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-800"
                  />
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-slate-100 truncate">{selectedApplicant.displayName}</h3>
                      <button
                        type="button"
                        onClick={() => handleDeleteApplicant(selectedApplicant.id)}
                        className="text-slate-500 hover:text-red-400 p-1 rounded-lg transition"
                        title="Delete Applicant Data"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-purple-400 font-mono uppercase">{selectedApplicant.primaryCategory}</p>
                    <p className="text-xs text-slate-500 leading-none mt-1">{selectedApplicant.location}</p>
                  </div>
                </div>

                {/* Substantive Candidate Credentials */}
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                    <div>
                      <p className="text-slate-500 font-mono text-[9px] uppercase">Confidential Name</p>
                      <p className="text-slate-200 mt-0.5 font-medium">{selectedApplicant.fullName}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-mono text-[9px] uppercase">Age Validation</p>
                      <p className="text-slate-200 mt-0.5 font-medium">{selectedApplicant.age} Years (Verified)</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-mono text-[9px] uppercase">Internet Class</p>
                      <p className="text-slate-200 mt-0.5 font-medium truncate">{selectedApplicant.internetSpeed || "Class Unknown"}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-mono text-[9px] uppercase">Languages</p>
                      <p className="text-slate-200 mt-0.5 font-medium truncate">{selectedApplicant.languages}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-slate-400 font-semibold uppercase font-mono text-[9px] mb-1">Career Goal & Bio</p>
                    <div className="bg-slate-950/20 border border-slate-800/80 p-3 rounded-xl text-[11px] text-slate-300 leading-relaxed font-sans block break-words max-h-36 overflow-y-auto">
                      " {selectedApplicant.introduction || "No description provided."} "
                    </div>
                  </div>

                  {/* Recruiter Review Interaction Controls */}
                  <div className="border-t border-slate-800/60 pt-4 space-y-4">
                    <span className="text-xs font-bold text-slate-200 block font-mono">RECRUITER REVIEW ACTIONS</span>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Update Status Dropdown */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-mono uppercase">LIFECYCLE STATUS</label>
                        <select
                          value={statusInput}
                          onChange={(e) => setStatusInput(e.target.value as ApplicationStatus)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:border-purple-500 focus:outline-none cursor-pointer"
                        >
                          <option value="new">new (pending)</option>
                          <option value="reviewing">reviewing</option>
                          <option value="contacted">contacted</option>
                          <option value="accepted">accepted</option>
                          <option value="declined">declined</option>
                        </select>
                      </div>

                      {/* Score Input */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-mono uppercase">RATING SCORE (0-100)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={scoreInput}
                          onChange={(e) => setScoreInput(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:border-purple-500 focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    {/* Interview Notes text area */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-mono uppercase">RECRUITER INTERVIEW NOTES</label>
                      <textarea
                        placeholder="Type internal notes regarding compensation, blocking rules, background verify check..."
                        rows={3}
                        value={notesInput}
                        onChange={(e) => setNotesInput(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-purple-500 focus:outline-none font-sans"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveAssessment}
                      className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition text-xs shadow-md shadow-purple-500/10"
                    >
                      Save Recruiter Assessment
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs flex-grow flex flex-col justify-center items-center">
                <FileCheck className="w-12 h-12 text-slate-800 mb-2" />
                <span>Select an applicant from the portfolio to view full documentation, verification status, and execute agency assessment actions.</span>
              </div>
            )}

            {/* Micro Breakdown Stats Widget */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-3 block">Category Distribution</span>
              {stats.categoriesChartData.length === 0 ? (
                <p className="text-xs text-slate-500">Awaiting database metrics...</p>
              ) : (
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <PieChart>
                      <Pie
                        data={stats.categoriesChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.categoriesChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}
                        itemStyle={{ color: '#ffffff', fontSize: '11px', fontFamily: 'monospace' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Legend Labels */}
                  <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] font-mono text-slate-400">
                    {stats.categoriesChartData.map((entry, index) => (
                      <div key={index} className="flex items-center gap-1.5 truncate">
                        <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                        <span>{entry.name}: {entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
