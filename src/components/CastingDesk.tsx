import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, query, orderBy, onSnapshot, 
  doc, setDoc, updateDoc, deleteDoc, serverTimestamp, getDocs, where
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  Video, Play, CheckCircle2, Clock, UserCheck, 
  XOctagon, Sparkles, Star, Trash2, Settings, 
  Mail, Wifi, User as UserIcon, Gauge, VideoOff, 
  ShieldCheck, AlertTriangle, HelpCircle, Calendar,
  ChevronRight, RefreshCw, Sliders, FileText,
  ExternalLink, Copy, Link, MessageSquare, Share2,
  Eye, Moon, Download
} from 'lucide-react';

// Preset Auditions for Demo Sandbox
const SANDBOX_AUDITIONS = [
  {
    id: "aud_sandbox1",
    applicantId: "app_sandbox1",
    applicantName: "Elena_Vixen",
    email: "elena.rostova@example.com",
    category: "Cosplay & Theme",
    scheduledTime: new Date(Date.now() + 3600000 * 1.5).toISOString(), // 1.5 hours from now (critical countdown alert)
    status: "scheduled",
    streamKey: "live_vixen_77x89",
    testWebcamQuality: "1080p WebCam Detected",
    streamBandwidth: "65 Mbps Upload",
    coachingNotes: "Lighting represents Prague winter style. Practice text filters. Ready for live casting feed.",
    scoreLighting: 90,
    scoreInteractive: 88,
    scoreStyling: 95,
    overallRating: 91,
    createdAt: new Date().toISOString()
  },
  {
    id: "aud_sandbox2",
    applicantId: "app_sandbox2",
    applicantName: "Kiki_ASMR",
    email: "naomi.t@example.com",
    category: "ASMR & Whispering",
    scheduledTime: new Date(Date.now() + 3600000 * 13.5).toISOString(), // 13.5 hours from now (upcoming countdown warning)
    status: "pending",
    streamKey: "live_kiki_33b11",
    testWebcamQuality: "Built-in HD WebCam",
    streamBandwidth: "120 Mbps Upload",
    coachingNotes: "Binaural headphone microphones verified. Recommended soft ringlight set to warm white glow.",
    scoreLighting: 75,
    scoreInteractive: 95,
    scoreStyling: 80,
    overallRating: 83,
    createdAt: new Date().toISOString()
  },
  {
    id: "aud_sandbox3",
    applicantId: "app_sandbox3",
    applicantName: "Clara_Synth",
    email: "clara.synth@example.com",
    category: "Interactive Chatting",
    scheduledTime: new Date(Date.now() + 3600000 * 36).toISOString(), // 36 hours from now (over 24h filter test - no countdown badge)
    status: "pending",
    streamKey: "live_clara_66f00",
    testWebcamQuality: "Dual Camera Setup (4K)",
    streamBandwidth: "85 Mbps Upload",
    coachingNotes: "Requires review of OBS overlay filters before casting room opens.",
    scoreLighting: 85,
    scoreInteractive: 80,
    scoreStyling: 90,
    overallRating: 85,
    createdAt: new Date().toISOString()
  }
];

const THEME_MAP = {
  'coal-lime': {
    id: 'coal-lime',
    label: 'Standard Charcoal',
    mainBg: 'bg-neutral-900 border-white/10 text-white',
    panelBg: 'bg-[#0c0c0c] border-white/10',
    panelHeaderBg: 'border-b border-white/10 bg-neutral-900/50',
    titleText: 'text-white font-sans',
    subText: 'text-neutral-400',
    monoText: 'text-neutral-300 font-mono',
    accentText: 'text-brand-lime',
    badge: 'bg-brand-lime/10 border-brand-lime/20 text-brand-lime',
    accentBorder: 'border-brand-lime',
    buttonAccent: 'bg-brand-lime text-black hover:bg-neutral-200',
    tabActive: 'bg-brand-lime text-black',
    borderBase: 'border-white/10',
    inputBg: 'bg-neutral-950 border-white/10 text-white focus:border-brand-lime'
  },
  'oled': {
    id: 'oled',
    label: 'OLED Midnight',
    mainBg: 'bg-black border-neutral-900 text-neutral-300',
    panelBg: 'bg-[#080808]/90 border-neutral-900',
    panelHeaderBg: 'border-b border-neutral-900 bg-neutral-950/70',
    titleText: 'text-emerald-50 font-sans',
    subText: 'text-neutral-550',
    monoText: 'text-emerald-600/80 font-mono',
    accentText: 'text-emerald-450',
    badge: 'bg-emerald-950/40 border-emerald-900/40 text-emerald-400',
    accentBorder: 'border-emerald-800',
    buttonAccent: 'bg-emerald-800 text-emerald-50 hover:bg-emerald-700',
    tabActive: 'bg-emerald-950 text-emerald-400 border border-emerald-800/80',
    borderBase: 'border-neutral-900',
    inputBg: 'bg-[#030303] border-neutral-900 text-neutral-300 focus:border-emerald-800'
  },
  'amber-fatigue': {
    id: 'amber-fatigue',
    label: 'Amber Fatigue Guard',
    mainBg: 'bg-stone-950 border-stone-900/80 text-stone-200',
    panelBg: 'bg-[#151310] border-stone-900/60',
    panelHeaderBg: 'border-b border-stone-900/60 bg-stone-950/60',
    titleText: 'text-stone-100 font-sans',
    subText: 'text-stone-500',
    monoText: 'text-amber-600/70 font-mono',
    accentText: 'text-amber-500',
    badge: 'bg-amber-950/40 border-amber-900/35 text-amber-500',
    accentBorder: 'border-amber-800',
    buttonAccent: 'bg-amber-700 text-stone-950 hover:bg-amber-600',
    tabActive: 'bg-amber-950 text-amber-500 border border-amber-850',
    borderBase: 'border-stone-900/60',
    inputBg: 'bg-[#0d0b09] border-stone-900 text-stone-200 focus:border-amber-700'
  },
  'dim-red': {
    id: 'dim-red',
    label: 'Crimson Red Room',
    mainBg: 'bg-[#080202] border-red-950/50 text-rose-200',
    panelBg: 'bg-[#0e0404]/90 border-[#1a0808]',
    panelHeaderBg: 'border-b border-[#1a0808] bg-[#060101]',
    titleText: 'text-rose-100 font-sans',
    subText: 'text-zinc-650',
    monoText: 'text-rose-700/60 font-mono',
    accentText: 'text-red-500',
    badge: 'bg-red-950/40 border-red-900/30 text-red-400',
    accentBorder: 'border-red-900',
    buttonAccent: 'bg-red-900 text-white hover:bg-red-800',
    tabActive: 'bg-red-950 text-red-400 border border-red-900',
    borderBase: 'border-red-950/30',
    inputBg: 'bg-black border-red-950/20 text-rose-200 focus:border-red-900'
  }
};

interface CastingDeskProps {
  initialApplicant?: {
    id: string;
    displayName: string;
    email: string;
    primaryCategory: string;
  } | null;
  onExit?: () => void;
}

export default function CastingDesk({ initialApplicant, onExit }: CastingDeskProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [isSandbox, setIsSandbox] = useState<boolean>(true);

  // General state
  const [auditions, setAuditions] = useState<any[]>([]);
  const [selectedAudition, setSelectedAudition] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Active view: 'portal' (applicant side) | 'admin' (recruiter side)
  const [currentMode, setCurrentMode] = useState<'portal' | 'admin'>('portal');

  // Input States (Applicant scheduler)
  const [bookingName, setBookingName] = useState(initialApplicant?.displayName || '');
  const [bookingEmail, setBookingEmail] = useState(initialApplicant?.email || '');
  const [bookingId, setBookingId] = useState(initialApplicant?.id || '');
  const [bookingCategory, setBookingCategory] = useState(initialApplicant?.primaryCategory || 'Interactive Chatting');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTimeSlot, setBookingTimeSlot] = useState('14:00');

  // Practicing Stream Simulation
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);
  const [diagnosticsResults, setDiagnosticsResults] = useState<{
    fps: number;
    latency: number;
    bitrate: string;
    resolution: string;
    passed: boolean;
  } | null>(null);

  // Evaluation Fields (Admin Review)
  const [mgmtStatus, setMgmtStatus] = useState<'pending' | 'scheduled' | 'live' | 'completed' | 'canceled'>('pending');
  const [mgmtCoaching, setMgmtCoaching] = useState('');
  const [mgmtLighting, setMgmtLighting] = useState(80);
  const [mgmtInteractive, setMgmtInteractive] = useState(80);
  const [mgmtStyling, setMgmtStyling] = useState(80);
  const [evaluationFeedback, setEvaluationFeedback] = useState('');

  // Feed Simulation for Admin
  const [isAdminViewingFeed, setIsAdminViewingFeed] = useState(false);
  const [feedLogs, setFeedLogs] = useState<string[]>([]);

  // Search/Lookup state for Model applicants returning to page
  const [lookupEmail, setLookupEmail] = useState('');
  const [applicantWebcamInfo, setApplicantWebcamInfo] = useState('Checking hardware permissions...');

  // Model Outreach and Obfuscation Tool States
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [outreachName, setOutreachName] = useState('Vivid Casting Coordinator');
  const [outreachBonus, setOutreachBonus] = useState('$1,500 Stream Launch Bonus');
  const [customShortSlug, setCustomShortSlug] = useState('vivid-casting-apply');
  const [tinyurlApiKey, setTinyurlApiKey] = useState('Go5zF0fXwJ33Wj1iBK224uYsdPkPq7PQHIQs3tOu3femGt38EjPjc1o1itgr');
  const [shortenedUrl, setShortenedUrl] = useState('');
  const [isShortening, setIsShortening] = useState(false);
  const [shortenError, setShortenError] = useState<string | null>(null);

  // Setup Guide interactive states
  const [selectedLightingTab, setSelectedLightingTab] = useState<'ring' | 'softbox' | 'natural' | 'lowlight'>('ring');
  const [selectedBgTab, setSelectedBgTab] = useState<'minimal' | 'gaming' | 'cosplay' | 'drapery'>('minimal');
  const [setupChecklist, setSetupChecklist] = useState({
    lightAngle: false,
    diffuseGlow: false,
    cameralevel: false,
    contrastGear: false,
    clutterClean: false,
    focusDepth: false,
  });

  // Eye Strain Guard Custom CastingDesk theme selection
  const [deskTheme, setDeskTheme] = useState<'coal-lime' | 'oled' | 'amber-fatigue' | 'dim-red'>(() => {
    try {
      const saved = localStorage.getItem('vivid_desk_theme');
      if (saved && ['coal-lime', 'oled', 'amber-fatigue', 'dim-red'].includes(saved)) {
        return saved as any;
      }
    } catch (e) {}
    return 'coal-lime';
  });

  const currentTheme = THEME_MAP[deskTheme] || THEME_MAP['coal-lime'];

  useEffect(() => {
    try {
      localStorage.setItem('vivid_desk_theme', deskTheme);
    } catch (e) {}
  }, [deskTheme]);

  // Generate and download a CSV report of all auditions, including applicant name, category, and overall rating
  const handleDownloadCSV = () => {
    if (!auditions || auditions.length === 0) {
      alert("No auditions available to generate a CSV report.");
      return;
    }

    const headers = [
      "Applicant Name",
      "Email",
      "Category",
      "Scheduled Time",
      "Status",
      "Overall Rating %",
      "Lighting Score %",
      "Interactive Score %",
      "Styling Score %",
      "Coaching Notes",
      "Stream Key"
    ];

    const rows = auditions.map(aud => [
      aud.applicantName || '',
      aud.email || '',
      aud.category || '',
      aud.scheduledTime ? new Date(aud.scheduledTime).toISOString() : '',
      aud.status || '',
      aud.overallRating !== undefined && aud.overallRating !== null ? `${aud.overallRating}` : 'N/A',
      aud.scoreLighting !== undefined && aud.scoreLighting !== null ? `${aud.scoreLighting}` : 'N/A',
      aud.scoreInteractive !== undefined && aud.scoreInteractive !== null ? `${aud.scoreInteractive}` : 'N/A',
      aud.scoreStyling !== undefined && aud.scoreStyling !== null ? `${aud.scoreStyling}` : 'N/A',
      (aud.coachingNotes || '').replace(/"/g, '""'), // Escape quotes
      aud.streamKey || ''
    ]);

    // Use RFC 4180 standard escaping - wrap fields in double quotes, escape existing double quotes
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `casting_auditions_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Periodic state trigger to auto-update countdown timers every 30s
  const [timeTick, setTimeTick] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTick((prev) => prev + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Helper function to flags auditions scheduled for within the next 24 hours with a countdown timer / warning indicator
  const getUpcomingAlert = (scheduledTimeStr: string) => {
    if (!scheduledTimeStr) return null;
    const scheduledTime = new Date(scheduledTimeStr).getTime();
    if (isNaN(scheduledTime)) return null;

    const now = Date.now();
    const diffMs = scheduledTime - now;

    // Past check
    if (diffMs < 0) {
      return {
        isUpcoming: false,
        isPast: true,
        label: 'Passed',
        colorClass: 'text-zinc-500 bg-neutral-900 border border-white/5'
      };
    }

    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours > 24) {
      return null; // More than 24h away
    }

    // Within next 24 hours
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    let countdownLabel = '';
    const isCritical = hours < 2; // red-alert if under 2 hours

    if (hours === 0) {
      countdownLabel = `${mins}m left`;
    } else {
      countdownLabel = `${hours}h ${mins}m left`;
    }

    return {
      isUpcoming: true,
      isPast: false,
      label: countdownLabel,
      isCritical,
      colorClass: isCritical
        ? 'bg-red-500/15 text-red-400 border border-red-500/30'
        : 'bg-amber-400/10 text-amber-300 border border-amber-400/20'
    };
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email === 'hitbit2024@gmail.com') {
        setIsAdminMode(true);
        setIsSandbox(false);
        setCurrentMode('admin'); // Auto flip to coordinator view if true manager logs in
      } else {
        setIsAdminMode(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch / Sync Auditions
  useEffect(() => {
    if (isSandbox) {
      const saved = localStorage.getItem('vivid_auditions_sandbox');
      if (saved) {
        try {
          let parsed = JSON.parse(saved);
          
          // Make sure Elena, Kiki, and Clara always remain live/upcoming relative to today
          // so the 30-second live countdown remains vivid and active!
          let pModified = false;
          parsed = parsed.map((aud: any) => {
            if (aud.id === 'aud_sandbox1') {
              const targetTime = new Date(Date.now() + 3600000 * 1.5).toISOString(); // 1.5 hours away
              if (Math.abs(new Date(aud.scheduledTime).getTime() - (Date.now() + 3600000 * 1.5)) > 60000) {
                aud.scheduledTime = targetTime;
                pModified = true;
              }
            } else if (aud.id === 'aud_sandbox2') {
              const targetTime = new Date(Date.now() + 3600000 * 13.5).toISOString(); // 13.5 hours away
              if (Math.abs(new Date(aud.scheduledTime).getTime() - (Date.now() + 3600000 * 13.5)) > 60000) {
                aud.scheduledTime = targetTime;
                pModified = true;
              }
            } else if (aud.id === 'aud_sandbox3') {
              const targetTime = new Date(Date.now() + 3600000 * 36).toISOString(); // 36 hours away
              if (Math.abs(new Date(aud.scheduledTime).getTime() - (Date.now() + 3600000 * 36)) > 60000) {
                aud.scheduledTime = targetTime;
                pModified = true;
              }
            }
            return aud;
          });

          if (pModified) {
            localStorage.setItem('vivid_auditions_sandbox', JSON.stringify(parsed));
          }
          setAuditions(parsed);
        } catch {
          setAuditions(SANDBOX_AUDITIONS);
        }
      } else {
        setAuditions(SANDBOX_AUDITIONS);
        localStorage.setItem('vivid_auditions_sandbox', JSON.stringify(SANDBOX_AUDITIONS));
      }
    } else {
      setLoading(true);
      const q = query(collection(db, 'auditions'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
          });
        });
        setAuditions(list);
        setLoading(false);
      }, (err) => {
        console.error("Auditions query subscription issue:", err);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [isSandbox]);

  // Sync parameters if initial applicant changes
  useEffect(() => {
    if (initialApplicant) {
      setBookingName(initialApplicant.displayName);
      setBookingEmail(initialApplicant.email);
      setBookingId(initialApplicant.id);
      setBookingCategory(initialApplicant.primaryCategory);
    }
  }, [initialApplicant]);

  // Handle webcam permission inside iframe safely
  const toggleCamera = async () => {
    if (cameraActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      setCameraActive(false);
    } else {
      try {
        setApplicantWebcamInfo('Requesting secure media channels...');
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: true });
        setCameraActive(true);
        setApplicantWebcamInfo('1080p HD WideAngle Camera Connected (60 FPS)');
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn("Camera media access blocked or inside iframe boundary. Activating crystal sandbox virtual stream.", err);
        setCameraActive(true);
        setApplicantWebcamInfo('Virtual HD Stream Emulator Activated (1080p, 60fps)');
      }
    }
  };

  // Run Stream diagnostics simulation
  const runDiagnostics = () => {
    setDiagnosticsRunning(true);
    setDiagnosticsResults(null);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step === 4) {
        clearInterval(interval);
        setDiagnosticsResults({
          fps: 60,
          latency: 24,
          bitrate: "6.2 Mbps (Stable RTMP)",
          resolution: "1920 x 1080 (HD 1080p)",
          passed: true
        });
        setDiagnosticsRunning(false);
      }
    }, 800);
  };

  // Create an Audition Document
  const handleScheduleAudition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId || !bookingName || !bookingEmail || !bookingDate || !bookingTimeSlot) {
      alert("Please fill out your identity parameters and choose a scheduled date/timestamp.");
      return;
    }

    const auditionId = 'aud_' + Math.random().toString(36).substring(2, 11);
    const combinedDateTime = `${bookingDate}T${bookingTimeSlot}:00`;
    const mockKey = `live_${bookingName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Math.random().toString(36).substring(2, 7)}`;

    const payload = {
      applicantId: bookingId.trim(),
      applicantName: bookingName.trim(),
      email: bookingEmail.trim().toLowerCase(),
      category: bookingCategory,
      scheduledTime: new Date(combinedDateTime).toISOString(),
      status: 'pending' as const,
      streamKey: mockKey,
      testWebcamQuality: applicantWebcamInfo,
      streamBandwidth: diagnosticsResults ? diagnosticsResults.bitrate : "55 Mbps Upload",
      coachingNotes: '',
      scoreLighting: 0,
      scoreInteractive: 0,
      scoreStyling: 0,
      overallRating: 0,
      createdAt: serverTimestamp()
    };

    if (isSandbox) {
      const payloadLocal = {
        ...payload,
        id: auditionId,
        createdAt: new Date().toISOString()
      };
      const updated = [payloadLocal, ...auditions];
      setAuditions(updated);
      localStorage.setItem('vivid_auditions_sandbox', JSON.stringify(updated));
      alert(`Audition Scheduled Successfully! Keep your Stream Key: ${mockKey}`);
      // Find and select this newly booked audition for practice
      setSelectedAudition(payloadLocal);
    } else {
      try {
        await setDoc(doc(db, 'auditions', auditionId), payload);
        alert(`Audition directly registered securely in Firestore!\nStream Key: ${mockKey}`);
        
        // Let's also update the applicant status to 'reviewing' if applicable
        try {
          await updateDoc(doc(db, 'applicants', bookingId), {
            status: 'reviewing',
            updatedAt: serverTimestamp()
          });
        } catch (appErr) {
          console.log("Auto candidate status sync was filtered by security permissions.");
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `auditions/${auditionId}`);
      }
    }
  };

  // Lookup existing scheduled auditions
  const [searchedAuditions, setSearchedAuditions] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  const handleLookupAuditionByEmail = () => {
    if (!lookupEmail || !lookupEmail.includes('@')) {
      alert("Please enter a valid lookup email.");
      return;
    }
    const filtered = auditions.filter(aud => aud.email.toLowerCase() === lookupEmail.trim().toLowerCase());
    setSearchedAuditions(filtered);
    setSearched(true);
    if (filtered.length > 0) {
      setSelectedAudition(filtered[0]);
    }
  };

  // Recruiter assessment inputs synchronization
  const handleSelectAuditionForReview = (aud: any) => {
    setSelectedAudition(aud);
    setMgmtStatus(aud.status);
    setMgmtCoaching(aud.coachingNotes || '');
    setMgmtLighting(aud.scoreLighting || 80);
    setMgmtInteractive(aud.scoreInteractive || 80);
    setMgmtStyling(aud.scoreStyling || 80);
    setFeedLogs(["Awaiting live signal sync...", "Initializing decoders..."]);
    setIsAdminViewingFeed(false);
  };

  // Launch Simulated Recruiter Feedback logs
  const launchMonitorFeed = () => {
    setIsAdminViewingFeed(true);
    setFeedLogs(["Connecting RTMP server...", "Handshake completed with stream key...", "Decoding 1080p video feed...", "Detecting face geometry to block localized ISPs...", "Audio sync: Nominal (+2ms delay)"]);
  };

  // Save Recruiter Casting Evaluation
  const handleSaveCastingAssessment = async () => {
    if (!selectedAudition) return;

    const overall = Math.round((Number(mgmtLighting) + Number(mgmtInteractive) + Number(mgmtStyling)) / 3);

    const payloadUpdates = {
      status: mgmtStatus,
      coachingNotes: mgmtCoaching,
      scoreLighting: Number(mgmtLighting),
      scoreInteractive: Number(mgmtInteractive),
      scoreStyling: Number(mgmtStyling),
      overallRating: overall,
      updatedAt: serverTimestamp()
    };

    if (isSandbox) {
      const updated = auditions.map(aud => {
        if (aud.id === selectedAudition.id) {
          return {
            ...aud,
            ...payloadUpdates,
            updatedAt: new Date().toISOString()
          };
        }
        return aud;
      });
      setAuditions(updated);
      localStorage.setItem('vivid_auditions_sandbox', JSON.stringify(updated));
      setSelectedAudition({
        ...selectedAudition,
        ...payloadUpdates,
        overallRating: overall
      });
      alert("Casting assessment and ratings saved (Sandbox Mode)!");
    } else {
      try {
        const docRef = doc(db, 'auditions', selectedAudition.id);
        await updateDoc(docRef, {
          status: mgmtStatus,
          coachingNotes: mgmtCoaching,
          scoreLighting: Number(mgmtLighting),
          scoreInteractive: Number(mgmtInteractive),
          scoreStyling: Number(mgmtStyling),
          overallRating: overall,
          updatedAt: serverTimestamp()
        });
        
        // If status is completed or approved, optionally update corresponding candidate status to accepted
        if (mgmtStatus === 'completed' && overall >= 80) {
          try {
            await updateDoc(doc(db, 'applicants', selectedAudition.applicantId), {
              status: 'accepted',
              notes: `Audition graded ${overall}%. Standard HD casting cleared successfully.`,
              updatedAt: serverTimestamp()
            });
          } catch {
            console.log("Model promotion bypassed security rule restriction.");
          }
        }

        setSelectedAudition({
          ...selectedAudition,
          status: mgmtStatus,
          coachingNotes: mgmtCoaching,
          scoreLighting: Number(mgmtLighting),
          scoreInteractive: Number(mgmtInteractive),
          scoreStyling: Number(mgmtStyling),
          overallRating: overall
        });
        alert("Casting assessment committed to Firestore cloud!");
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `auditions/${selectedAudition.id}`);
      }
    }
  };

  // Delete Audit Slot
  const handleDeleteAudition = async (id: string) => {
    if (!confirm("Are you sure you want to delete this audition slot permanently?")) return;
    
    if (isSandbox) {
      const filtered = auditions.filter(aud => aud.id !== id);
      setAuditions(filtered);
      localStorage.setItem('vivid_auditions_sandbox', JSON.stringify(filtered));
      setSelectedAudition(null);
    } else {
      try {
        await deleteDoc(doc(db, 'auditions', id));
        setSelectedAudition(null);
        alert("Session document deleted from Firestore.");
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `auditions/${id}`);
      }
    }
  };

  // Copy to Clipboard Utility with State Warning
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const getAppUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return "https://vivid-casting-studio.app";
  };

  const handleShortenUrl = async () => {
    if (!tinyurlApiKey.trim()) {
      setShortenError("Please enter or verify your TinyURL API Token first.");
      return;
    }
    
    setIsShortening(true);
    setShortenError(null);
    try {
      const destinationUrl = getAppUrl();
      const payload: any = {
        url: destinationUrl,
        domain: "tinyurl.com"
      };

      if (customShortSlug.trim()) {
        payload.alias = customShortSlug.trim().toLowerCase();
      }

      const response = await fetch("https://api.tinyurl.com/create", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${tinyurlApiKey.trim()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      let result: any;
      try {
        result = JSON.parse(responseText);
      } catch (parseErr) {
        throw new Error(`TinyURL server returned non-JSON response. Please check your token or custom alias requirements.`);
      }

      if (!response.ok) {
        throw new Error(result.errors?.join(", ") || `API request failed with status: ${response.status}`);
      }

      if (result.data?.tiny_url) {
        setShortenedUrl(result.data.tiny_url);
      } else {
        throw new Error("TinyURL API responded successfully, but the expected shortened link property was missing.");
      }
    } catch (err: any) {
      console.error("Link shortening API error:", err);
      setShortenError(err.message || "Failed to shorten link. Please ensure your custom alias is not taken, or retry.");
    } finally {
      setIsShortening(false);
    }
  };

  return (
    <div className={`transition-all duration-300 rounded-none p-6 md:p-8 border ${currentTheme.mainBg}`} id="management-casting-hub">
      {/* Eye Fatigue Guard bar */}
      <div className={`flex flex-wrap justify-between items-center gap-2 mb-4 p-2 text-[9px] font-mono select-none border ${currentTheme.panelBg}`}>
        <div className="flex items-center gap-1.5">
          <Moon className={`w-3.5 h-3.5 ${currentTheme.accentText}`} />
          <span className={`${currentTheme.subText} font-bold uppercase`}>Eye Fatigue Prevention:</span>
          <span className={`font-black uppercase ${currentTheme.accentText}`}>{currentTheme.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`${currentTheme.subText} uppercase font-bold text-[8px]`}>Calibrate Luminance:</span>
          <div className="flex gap-1.5">
            {[
              { id: 'coal-lime', label: 'Classic', border: 'border-brand-lime', dot: 'bg-brand-lime' },
              { id: 'oled', label: 'OLED Black', border: 'border-emerald-500', dot: 'bg-emerald-500' },
              { id: 'amber-fatigue', label: 'Amber Guard', border: 'border-amber-500', dot: 'bg-amber-500' },
              { id: 'dim-red', label: 'Red Room', border: 'border-red-500', dot: 'bg-red-500' }
            ].map((th) => (
              <button
                key={th.id}
                type="button"
                onClick={() => setDeskTheme(th.id as any)}
                title={th.label}
                className={`flex items-center gap-1 px-2 py-0.5 border text-[8px] font-black uppercase tracking-wide transition cursor-pointer ${
                  deskTheme === th.id 
                    ? `text-white opacity-100 bg-white/10 ${th.border}`
                    : `border-transparent text-neutral-400 opacity-60 hover:opacity-100`
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${th.dot}`}></div>
                <span>{th.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Upper Module navigation */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-6 mb-6 gap-4 ${currentTheme.borderBase}`}>
        <div>
          <span className={`text-[10px] font-mono font-black uppercase tracking-[0.2em] block ${currentTheme.accentText}`}>STUDIO CASTING & PERFORMANCE DIRECTORY</span>
          <h2 className="text-2xl md:text-3xl font-black font-display uppercase mt-1 flex items-center gap-2">
            <Video className={`w-7 h-7 stroke-[2] ${currentTheme.accentText}`} />
            Auditions with Management
          </h2>
          <p className={`text-xs mt-1 ${currentTheme.subText}`}>
            Perform diagnostics checks, schedule live token-payout test streams, and review management feedback profiles.
          </p>
        </div>
 
         {/* View Mode Toggle */}
         <div className={`flex p-0.5 rounded-none self-stretch md:self-auto border ${currentTheme.panelBg}`}>
           <button
             type="button"
             onClick={() => setCurrentMode('portal')}
             className={`flex-1 md:flex-initial py-2 px-4 text-xs font-bold uppercase tracking-wider transition ${
               currentMode === 'portal' ? currentTheme.tabActive : 'text-neutral-400 hover:text-white'
             }`}
           >
             Applicant Portal
           </button>
           <button
             type="button"
             onClick={() => {
               if (!isAdminMode && isSandbox === false) {
                 alert("Please log in as Administrator 'hitbit2024@gmail.com' at the footer to view cloud recruiter files, or run details in Sandbox Mode.");
               }
               setCurrentMode('admin');
             }}
             className={`flex-1 md:flex-initial py-2 px-4 text-xs font-bold uppercase tracking-wider transition ${
               currentMode === 'admin' ? currentTheme.tabActive : 'text-neutral-400 hover:text-white'
             }`}
           >
             Coordinator Desk {isAdminMode && "✦"}
           </button>
         </div>
       </div>
 
       {/* Mode 1: Applicant Auditions Desk */}
       {currentMode === 'portal' && (
         <>
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in" id="portal-mode-box">
           
           {/* Booking & Registration form */}
           <div className={`lg:col-span-5 p-6 space-y-6 flex flex-col justify-between border ${currentTheme.panelBg}`}>
             <div>
               <h3 className="text-md font-extrabold uppercase tracking-wider font-display flex items-center gap-2 mb-4">
                 <Calendar className={`w-5 h-5 ${currentTheme.accentText}`} />
                 Book Your Casting Call
               </h3>
               
               <form onSubmit={handleScheduleAudition} className="space-y-4">
                 <div className="space-y-1.5">
                   <label className={`text-[9px] uppercase font-bold tracking-wider font-mono ${currentTheme.subText}`}>Stage / Display Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Stage name (e.g. Elena_Vixen)"
                    value={bookingName}
                    onChange={(e) => setBookingName(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/10 font-sans p-2.5 text-xs text-white uppercase tracking-wider focus:border-brand-lime focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider font-mono">Applicant Reference ID</label>
                  <input
                    type="text"
                    required
                    placeholder="Candidate Reference ID (e.g. app_sandbox1)"
                    value={bookingId}
                    onChange={(e) => setBookingId(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/10 font-sans p-2.5 text-xs text-white focus:border-brand-lime focus:outline-none"
                  />
                  {!initialApplicant && (
                    <p className="text-[9px] text-neutral-500">Copy the ID from your submitted forms to match records strictly.</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider font-mono">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="Confidential Email address"
                    value={bookingEmail}
                    onChange={(e) => setBookingEmail(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/10 font-sans p-2.5 text-xs text-white focus:border-brand-lime focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider font-mono">Select Niche</label>
                    <select
                      value={bookingCategory}
                      onChange={(e) => setBookingCategory(e.target.value)}
                      className="w-full bg-neutral-900 border border-white/10 p-2.5 text-xs text-white focus:border-brand-lime cursor-pointer"
                    >
                      <option value="Interactive Chatting">Interactive Chatting</option>
                      <option value="Cosplay & Theme">Cosplay & Theme</option>
                      <option value="Dance & Artistic">Dance & Artistic</option>
                      <option value="Gaming & Play">Gaming & Play</option>
                      <option value="ASMR & Whispering">ASMR & Whispering</option>
                      <option value="Other Creative Niche">Other Creative Niche</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider font-mono">Audition Slot</label>
                    <select
                      value={bookingTimeSlot}
                      onChange={(e) => setBookingTimeSlot(e.target.value)}
                      className="w-full bg-neutral-900 border border-white/10 p-2.5 text-xs text-white focus:border-brand-lime cursor-pointer font-mono"
                    >
                      <option value="09:00">09:00 AM UTC</option>
                      <option value="11:00">11:00 AM UTC</option>
                      <option value="14:00">02:00 PM UTC</option>
                      <option value="16:00">04:00 PM UTC</option>
                      <option value="18:00">06:00 PM UTC</option>
                      <option value="21:00">09:00 PM UTC</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider font-mono">Select Target Calendar Date</label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/10 font-mono p-2.5 text-xs text-white focus:border-brand-lime focus:outline-none"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-brand-lime hover:bg-brand-lime/90 text-black font-black uppercase text-xs tracking-widest transition cursor-pointer"
                >
                  Book Audition Session
                </button>
              </form>
            </div>

            {/* Quick search/lookup panel */}
            <div className="border-t border-white/10 pt-4 mt-6">
              <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block mb-2">Check Audition Details By Email</span>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="model@example.com"
                  value={lookupEmail}
                  onChange={(e) => setLookupEmail(e.target.value)}
                  className="flex-grow bg-neutral-900 border border-white/10 p-2 text-xs text-white focus:border-brand-lime focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleLookupAuditionByEmail}
                  className="py-2 px-4 bg-white text-black font-extrabold uppercase text-[10px] tracking-wider hover:bg-neutral-200 transition"
                >
                  Lookup
                </button>
              </div>

              {searched && (
                <div className="mt-3 text-[11px] font-mono p-2 bg-neutral-900 text-slate-300 border border-white/10">
                  {searchedAuditions.length === 0 ? (
                    <span className="text-amber-400">No audition request found under this email address.</span>
                  ) : (
                    <div>
                      <p className="text-green-400 font-bold">Found {searchedAuditions.length} recorded bookings:</p>
                      {searchedAuditions.map((aud, index) => {
                        const alertInfo = getUpcomingAlert(aud.scheduledTime);
                        return (
                          <div key={index} className="mt-2 border-t border-white/5 pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span>{new Date(aud.scheduledTime).toLocaleDateString()} {new Date(aud.scheduledTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                              {alertInfo?.isUpcoming && (
                                <span className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 border rounded ${alertInfo.colorClass}`}>
                                  <span className={`w-1 h-1 rounded-full animate-pulse ${alertInfo.isCritical ? 'bg-red-400' : 'bg-amber-400'}`}></span>
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>T-MINUS: {alertInfo.label}</span>
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] uppercase bg-brand-lime/10 border border-brand-lime/30 text-brand-lime px-1.5 py-0.2 font-bold">{aud.status}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Practice & Webcam diagnostic board */}
          <div className="lg:col-span-7 bg-neutral-950 border border-white/15 p-6 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                <h3 className="text-md font-extrabold text-white uppercase tracking-wider font-display flex items-center gap-2">
                  <Play className="w-5 h-5 text-brand-lime stroke-[2.5]" />
                  Model Practice Room & Diagnostics
                </h3>
                <span className="text-[8px] font-mono text-zinc-500 uppercase">Interactive Pre-stream check</span>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Prepare yourself prior to connecting live with management. Give webcam authorization below to configure your camera, monitor lighting parameters and review live presentation coaching guidelines.
                </p>

                {/* Webcam Preview Screen Box */}
                <div className="aspect-video w-full bg-neutral-900 border-2 border-white/10 flex flex-col items-center justify-center relative overflow-hidden">
                  {cameraActive ? (
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-6 text-neutral-500">
                      <VideoOff className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
                      <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Camera Feed Idle</p>
                      <p className="text-[10px] mt-1 text-neutral-600">Secure streams use sandboxed HTTPS capture variables.</p>
                    </div>
                  )}

                  {/* Canvas Overlays with detected specs */}
                  <div className="absolute top-3 left-3 bg-black/80 backdrop-blur border border-white/10 p-2 font-mono text-[9px] text-zinc-400 pointer-events-none">
                    <p className="font-bold text-white uppercase">Casting Stream Matrix</p>
                    <p className="mt-1">FPS: <span className="text-brand-lime font-bold">{cameraActive ? '60 FPS (RTMP)' : '0 FPS'}</span></p>
                    <p>Format: <span className="text-neutral-200">NV12 H.264 Encoder</span></p>
                    {diagnosticsResults && (
                      <>
                        <p>Resolution: <span className="text-neutral-200">{diagnosticsResults.resolution}</span></p>
                        <p>Throughput: <span className="text-brand-lime">{diagnosticsResults.bitrate}</span></p>
                      </>
                    )}
                  </div>

                  <div className="absolute bottom-3 right-3 flex gap-2">
                    <button
                      type="button"
                      onClick={toggleCamera}
                      className={`py-1.5 px-3 font-black text-[9px] uppercase tracking-wider rounded-none ${
                        cameraActive ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-brand-lime hover:bg-brand-lime/90 text-black'
                      }`}
                    >
                      {cameraActive ? 'Deactivate Camera' : 'Activate WebCam'}
                    </button>
                    
                    <button
                      type="button"
                      disabled={diagnosticsRunning}
                      onClick={runDiagnostics}
                      className="py-1.5 px-3 bg-neutral-950 text-white border border-white/20 hover:border-white font-mono text-[9px] uppercase tracking-wider"
                    >
                      {diagnosticsRunning ? 'Checking Bandwidth...' : 'Speed Test'}
                    </button>
                  </div>
                </div>

                {/* Diagnostics and coaching guidelines */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-neutral-900 border border-white/5 p-4 rounded-none space-y-2">
                    <span className="text-[10px] font-mono text-purple-400 font-bold block uppercase tracking-wider">Casting Setup Tips</span>
                    <ul className="text-[11px] text-neutral-400 space-y-1 font-sans list-disc pl-4 leading-relaxed">
                      <li>Use crisp warm lighting aimed from the front</li>
                      <li>Position camera at eye level</li>
                      <li>Wear high-contrast aesthetics or cosmetic styles</li>
                      <li>Verify your background looks organized and aesthetic</li>
                    </ul>
                  </div>

                  <div className="bg-neutral-900 border border-white/5 p-4 rounded-none space-y-2 font-mono text-[10px] text-zinc-300">
                    <span className="text-[10px] text-brand-lime font-bold block uppercase tracking-wider">Diagnostic Metrics</span>
                    <p className="mt-1">Webcam Hardware: <span className="text-white block font-sans truncate">{applicantWebcamInfo}</span></p>
                    <p className="mt-1.5">Network latency: {diagnosticsResults ? <span className="text-brand-lime">{diagnosticsResults.latency} ms (Good)</span> : "Click 'Speed Test'"}</p>
                    <p>Status check: {diagnosticsResults ? <span className="bg-green-500/20 text-green-400 px-1 py-0.2 rounded font-bold">STABLE FOR 1080P</span> : <span className="text-zinc-500 font-semibold">Ready</span>}</p>
                  </div>
                </div>
              </div>
            </div>

            {selectedAudition && (
              <div className="border border-brand-lime/20 bg-brand-lime/5 p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1 w-full md:w-auto">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-brand-lime" />
                    <span className="text-xs text-white font-bold uppercase tracking-wider">Booked Session Selected</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    Time: {new Date(selectedAudition.scheduledTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                  <p className="text-[10px] text-purple-400 font-mono">
                    ✦ Secure Stream Key: <strong className="text-white select-all">{selectedAudition.streamKey}</strong>
                  </p>
                  {(() => {
                    const alertInfo = getUpcomingAlert(selectedAudition.scheduledTime);
                    if (!alertInfo || !alertInfo.isUpcoming) return null;
                    return (
                      <div className={`mt-2 flex items-center gap-2 p-2 border font-mono text-[10px] uppercase select-none ${alertInfo.colorClass}`}>
                        <AlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 ${alertInfo.isCritical ? 'text-red-400 animate-pulse' : 'text-amber-400'}`} />
                        <span>Warning: Stream starts in {alertInfo.label}</span>
                      </div>
                    );
                  })()}
                  {selectedAudition.coachingNotes && (
                    <div className="mt-2 text-xs text-slate-300 bg-neutral-950 p-2 border border-white/10 font-sans italic">
                      "Management Coaching: {selectedAudition.coachingNotes}"
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 border border-brand-lime rounded font-mono ${
                    selectedAudition.status === 'scheduled' ? 'bg-indigo-950/40 text-indigo-400 border-indigo-800/40' :
                    selectedAudition.status === 'live' ? 'bg-green-950/40 text-green-400 border-green-800/40' :
                    selectedAudition.status === 'completed' ? 'bg-purple-950/40 text-purple-400 border-purple-800/40' :
                    'bg-slate-950/40 text-slate-400 border-slate-800/40'
                  }`}>
                    {selectedAudition.status}
                  </span>
                </div>
              </div>
            )}
            
          </div>
        </div>

        {/* SETUP & CALIBRATION GUIDE SUITE */}
        <div className="bg-neutral-950 border border-white/10 p-5 mt-8 space-y-6 animate-fade-in" id="setup-guide-hub">
          {/* Section banner */}
          <div className="border-b border-white/10 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-brand-lime stroke-[2.5]" />
                <h3 className="text-md font-bold uppercase tracking-wider text-white font-display">
                  Model Audition Setup & Scene Calibration Suite
                </h3>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Management evaluates lighting, styling, and scene layout strictly during auditions. Use this interactive system to calibrate your physical room.
              </p>
            </div>
            <div className="bg-neutral-900 border border-white/5 py-1 px-3 text-[10px] font-mono tracking-wider text-brand-lime uppercase flex items-center gap-1.5 self-stretch md:self-auto justify-center">
              <span className="w-1.5 h-1.5 bg-brand-lime rounded-full animate-ping"></span>
              <span>Online Reference Core</span>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pt-1">
            
            {/* Column 1: Calibration Integrity Index */}
            <div className="xl:col-span-4 bg-neutral-900/40 border border-white/5 p-4 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-brand-lime" />
                    Calibration Index
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">Live Index Rating</span>
                </div>

                {/* Score visualization widget */}
                <div className="bg-neutral-950/80 border border-white/10 p-3 text-center space-y-2">
                  <div className="flex justify-between items-center text-[10px] uppercase font-mono text-neutral-400">
                    <span>Preparation Level:</span>
                    <span className={`font-black tracking-wide ${
                      setupChecklist ? (Object.values(setupChecklist).filter(Boolean).length === Object.keys(setupChecklist).length ? 'text-brand-lime' :
                      Object.values(setupChecklist).filter(Boolean).length >= 3 ? 'text-amber-400' :
                      'text-red-400') : 'text-neutral-400'
                    }`}>
                      {Object.values(setupChecklist).filter(Boolean).length === Object.keys(setupChecklist).length ? 'Peak' :
                       Object.values(setupChecklist).filter(Boolean).length >= 3 ? 'Medium' :
                       'Deficient'}
                    </span>
                  </div>
                  
                  {/* Dynamic progress bar */}
                  <div className="w-full bg-neutral-900 h-2.5 border border-white/5 relative overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        Object.values(setupChecklist).filter(Boolean).length === Object.keys(setupChecklist).length ? 'bg-brand-lime' :
                        Object.values(setupChecklist).filter(Boolean).length >= 3 ? 'bg-amber-400' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.round((Object.values(setupChecklist).filter(Boolean).length / Object.keys(setupChecklist).length) * 100)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">Tuned Criteria</span>
                    <span className={`font-mono text-lg font-bold ${
                      Object.values(setupChecklist).filter(Boolean).length === Object.keys(setupChecklist).length ? 'text-brand-lime' :
                      Object.values(setupChecklist).filter(Boolean).length >= 3 ? 'text-amber-400' :
                      'text-red-400'
                    }`}>
                      {Object.values(setupChecklist).filter(Boolean).length}/{Object.keys(setupChecklist).length} ({Math.round((Object.values(setupChecklist).filter(Boolean).length / Object.keys(setupChecklist).length) * 100)}%)
                    </span>
                  </div>

                  <p className="text-[10px] text-zinc-450 font-sans leading-normal pt-1 text-left">
                    {Object.values(setupChecklist).filter(Boolean).length === Object.keys(setupChecklist).length ? (
                      "🎉 Excellent! Room calibration metrics suggest peak frame representation. Your model key is safe for high-conversion test streams."
                    ) : Object.values(setupChecklist).filter(Boolean).length >= 3 ? (
                      "⚠️ Good step, but critical elements (e.g. eye-level camera, diffusion) are missing. Check further conditions to hit 100%."
                    ) : (
                      "❌ Highly deficient. Ensure you ticking criteria as you position your camera and activate your local light panels."
                    )}
                  </p>
                </div>

                {/* Checklist options */}
                <div className="space-y-2.5 pt-1">
                  <span className="text-[8px] uppercase font-bold text-neutral-400 tracking-wider font-mono block">Interactive Checklist</span>
                  
                  <div className="space-y-2">
                    {[
                      { key: 'lightAngle', label: 'Key light offset 45° angle', desc: 'Position lights slightly off-center to block flat shadows.' },
                      { key: 'diffuseGlow', label: 'Diffuser ring active (No glare)', desc: 'Cover bare LEDs with sheets or ring diffusers.' },
                      { key: 'cameralevel', label: 'Webcam set at eye level', desc: 'Slightly elevated or level, with a minor downward tilt.' },
                      { key: 'contrastGear', label: 'Apparel contrasts wall tones', desc: 'Avoid matching backdrops closely in dark colors.' },
                      { key: 'clutterClean', label: 'Workspace free of messy cables', desc: 'No clothes, cups, or open door frames in sight.' },
                      { key: 'focusDepth', label: '3+ Feet shoulder space separation', desc: 'Provides professional physical bokeh separation.' },
                    ].map((item) => (
                      <label 
                        key={item.key}
                        className="flex items-start gap-2.5 p-2 bg-neutral-950 border border-white/5 hover:border-white/10 transition cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={(setupChecklist as any)[item.key]}
                          onChange={(e) => setSetupChecklist(prev => ({ ...prev, [item.key]: e.target.checked }))}
                          className="mt-0.5 w-3.5 h-3.5 accent-brand-lime cursor-pointer bg-neutral-900 border border-white/10 rounded-sm"
                        />
                        <div className="leading-tight">
                          <span className="text-[10px] font-bold text-white block uppercase tracking-wide">
                            {item.label}
                          </span>
                          <span className="text-[9px] text-neutral-500 font-mono block mt-0.5">
                            {item.desc}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Advanced Lighting Matrix */}
            <div className="xl:col-span-4 bg-neutral-900/40 border border-white/5 p-4 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-purple-400" />
                    Lighting calibration Path
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">Lumens Engine</span>
                </div>

                <p className="text-[11px] text-zinc-400 leading-normal">
                  Toggle different lighting architectures below to calibrate placement, angles, and estimated retention increases.
                </p>

                {/* Custom Tab buttons */}
                <div className="grid grid-cols-2 gap-1.5 bg-neutral-950 p-1 border border-white/5">
                  {[
                    { id: 'ring', label: 'Ring Light' },
                    { id: 'softbox', label: 'Double Soft' },
                    { id: 'natural', label: 'Daylight' },
                    { id: 'lowlight', label: 'Low-light' }
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => setSelectedLightingTab(btn.id as any)}
                      className={`py-1.5 px-2 text-[9px] uppercase font-mono font-bold tracking-wider transition cursor-pointer ${
                        selectedLightingTab === btn.id 
                          ? 'bg-purple-950/40 text-purple-400 border border-purple-800'
                          : 'bg-neutral-900 text-zinc-500 hover:text-white border border-transparent'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Diagram render block */}
                <div className="bg-neutral-950 p-3 border border-white/10 font-mono text-[9px] text-neutral-350 leading-relaxed space-y-3">
                  <span className="text-[8px] uppercase font-bold text-neutral-400 tracking-wider font-mono block border-b border-white/5 pb-1">
                    Ideal Equipment Placement Map
                  </span>
                  
                  {selectedLightingTab === 'ring' && (
                    <>
                      <pre className="text-purple-400 text-center leading-none text-[8px] font-mono select-none py-1.5">
{`    [ Ring Light Setup Map ]
      
       [Back Wall / Curtains]
                 |
              [Model]
                 ^
                 | (3 - 4 Feet Distance)
                 v
         [Ring Light + Cam]`}
                      </pre>
                      <div className="space-y-1.5 pt-1 border-t border-white/5">
                        <p className="text-[10px] font-sans text-neutral-300 leading-normal">
                          Mount your camera strictly in the center aperture of the ring. Keep the ring light 3 to 4 feet away. This forces natural circular catchlights in your pupil focal system and prevents flat white skin washed-out appearances. Fits perfectly with <strong>Interactive Chatting</strong>.
                        </p>
                        <div className="flex justify-between items-center pt-1 text-[9px] uppercase font-mono text-purple-400 font-bold">
                          <span>Est. Conversion Rate Lift:</span>
                          <span className="text-white bg-purple-950/60 px-1 border border-purple-800/40">+15% Viewers</span>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedLightingTab === 'softbox' && (
                    <>
                      <pre className="text-teal-400 text-center leading-none text-[8px] font-mono select-none py-1.5">
{`   [ Dual Softboxes Setup Map ]
   
      [Ambient Backlight Glow]
                 |
              [Model]
             /       \\
    [Softbox Key]   [Softbox Fill]
     (45° Right)     (45° Left/Dim)
                 v
             [Webcam]` }
                      </pre>
                      <div className="space-y-1.5 pt-1 border-t border-white/5">
                        <p className="text-[10px] font-sans text-neutral-300 leading-normal">
                          Position your primary softbox (Key Light) at an angle of 45° from your profile, slightly elevated. Place your secondary, diffuse softbox (Fill Light) on the opposite side set to 30%-50% brightness to clear shadows and create deep, professional casting contours. Fits with <strong>Cosplay & Theme</strong>.
                        </p>
                        <div className="flex justify-between items-center pt-1 text-[9px] uppercase font-mono text-teal-400 font-bold">
                          <span>Est. Conversion Rate Lift:</span>
                          <span className="text-white bg-teal-950/60 px-1 border border-teal-800/40">+22% Fidelity</span>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedLightingTab === 'natural' && (
                    <>
                      <pre className="text-brand-lime text-center leading-none text-[8px] font-mono select-none py-1.5">
{`   [ Daylight Orientation Map ]
   
       [Matte Setup backdrop]
                 |
              [Model]
                 ^
                 | (Faces window glasses)
                 v
       ==========[=============
       [Window Glass x Sheers]`}
                      </pre>
                      <div className="space-y-1.5 pt-1 border-t border-white/5">
                        <p className="text-[10px] font-sans text-neutral-300 leading-normal">
                          Face the window directly. Natural ambient light is pristine but requires a clean, semi-sheer curtain to diffuse incoming solar glare and heat. Never permit strong sunlight to point behind your shoulder, as it wraps around the focus plane and silhouettises your profile completely.
                        </p>
                        <div className="flex justify-between items-center pt-1 text-[9px] uppercase font-mono text-brand-lime font-bold">
                          <span>Est. Conversion Rate Lift:</span>
                          <span className="text-white bg-neutral-900 px-1 border border-brand-lime/30">+18% Realness</span>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedLightingTab === 'lowlight' && (
                    <>
                      <pre className="text-red-400 text-center leading-none text-[8px] font-mono select-none py-1.5">
{`   [ Late-night Chamber Setup ]
   
     [Neon Backbar / RGB Strip]  <-- Backlight Color accent
                 |
              [Model]
                 ^
                 |  (Slight dim front illumination)
                 v
         [Key Light @ 15% Max]`}
                      </pre>
                      <div className="space-y-1.5 pt-1 border-t border-white/5">
                        <p className="text-[10px] font-sans text-neutral-300 leading-normal">
                          In late-night streams, light the background walls in an intimate accent (like a deep blue or warm orange LED halo glow). Keep target faces soft and gentle using a heavily dimmed key light. Boost your webcam gain/exposure slightly in OBS settings to maintain skin clarity without flattening colors.
                        </p>
                        <div className="flex justify-between items-center pt-1 text-[9px] uppercase font-mono text-red-400 font-bold">
                          <span>Est. Conversion Rate Lift:</span>
                          <span className="text-white bg-red-950/60 px-1 border border-red-900/40">+12% Vibe</span>
                        </div>
                      </div>
                    </>
                  )}

                </div>
              </div>
            </div>

            {/* Column 3: Scene Architecture */}
            <div className="xl:col-span-4 bg-neutral-900/40 border border-white/5 p-4 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-brand-lime" />
                    Scene Architecture Directive
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">Aesthetic Space</span>
                </div>

                <p className="text-[11px] text-zinc-400 leading-normal">
                  Optimized setups establish professional stream environments. Select your background niche configuration below to calibrate elements.
                </p>

                {/* Background selection custom list */}
                <div className="space-y-1 bg-neutral-950 p-1 border border-white/5">
                  {[
                    { id: 'minimal', label: 'Minimalist Studio Space', code: 'Scandinavian Minimal' },
                    { id: 'gaming', label: 'Neon Retro Accent Grid', code: 'Cyberpunk & Interactive' },
                    { id: 'cosplay', label: 'Cosplay Theme Backdrop', code: 'Immersive Costume Decor' },
                    { id: 'drapery', label: 'Cozy Editorial Drapes', code: 'Velvet Blackout Luxury' }
                  ].map((bg) => (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => setSelectedBgTab(bg.id as any)}
                      className={`w-full text-left p-2 transition flex items-center justify-between font-mono cursor-pointer ${
                        selectedBgTab === bg.id 
                          ? 'bg-brand-lime/10 border-l-2 border-l-brand-lime text-white animate-fade-in'
                          : 'bg-neutral-900 text-zinc-500 hover:text-zinc-350 border-l-2 border-l-transparent'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase">{bg.label}</span>
                      <span className="text-[8px] text-zinc-500 font-normal">{bg.code}</span>
                    </button>
                  ))}
                </div>

                {/* Backplate advice */}
                <div className="bg-neutral-950 p-3 border border-white/10 font-sans text-xs space-y-3">
                  <div className="flex justify-between items-center border-b border-white/5 pb-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-400 font-mono tracking-wider">Calibration guidelines</span>
                    <span className="text-[9px] font-mono bg-neutral-900 border border-white/10 text-white px-1.5">
                      {selectedBgTab === 'minimal' && 'Aesthetic: Cream/Classic'}
                      {selectedBgTab === 'gaming' && 'Aesthetic: Magenta/Amber'}
                      {selectedBgTab === 'cosplay' && 'Aesthetic: Fantasy/Themed'}
                      {selectedBgTab === 'drapery' && 'Aesthetic: Warm/Editorial'}
                    </span>
                  </div>

                  {selectedBgTab === 'minimal' && (
                    <div className="space-y-2.5">
                      <p className="text-neutral-300 leading-relaxed text-[11px]">
                        Utilize simple, clean walls (matte gray, cream, sage, or dark charcoal). Arrange a single piece of clean wall art slightly offset. Set up warm-toned cozy side lamps on bookshelves behind your shoulders to serve as soothing glowing depth points without blinding the webcam.
                      </p>
                      <p className="text-[10px] text-brand-lime font-mono italic leading-relaxed">
                        ★ Pro Management Tip: Never keep empty, unadorned walls — they introduce echo issues and look clinical. Place a botanical leaf plant (e.g. Monstera) to ground the visual scene.
                      </p>
                    </div>
                  )}

                  {selectedBgTab === 'gaming' && (
                    <div className="space-y-2.5">
                      <p className="text-neutral-300 leading-relaxed text-[11px]">
                        Configure digital smart lights or hexagonal light fixtures along a dark-panel wall. Set your color controllers to solid complementary styles only (such as Amber + Deep Purple or Indigo + Coral). Multi-color rainbows appear messy and look cheap on recording displays.
                      </p>
                      <p className="text-[10px] text-brand-lime font-mono italic leading-relaxed">
                        ★ Pro Management Tip: Do not position neon tubes directly in front of the lens. Rather, project them onto back walls to get clean, soft color diffusion curves on stream.
                      </p>
                    </div>
                  )}

                  {selectedBgTab === 'cosplay' && (
                    <div className="space-y-2.5">
                      <p className="text-neutral-300 leading-relaxed text-[11px]">
                        Match background decorations specifically to your character universe (e.g., themed draperies, custom weapon/prop racks, or glowing crystal elements). Choose textures that highlight the wardrobe and prevent the scene from appearing like a flat bedroom wall.
                      </p>
                      <p className="text-[10px] text-brand-lime font-mono italic leading-relaxed">
                        ★ Pro Management Tip: Absolute thematic suspension of disbelief is key. Hidden details like an ordinary plastic container, simple clothing hangers, or visible laundry instantly ruin viewer immersion.
                      </p>
                    </div>
                  )}

                  {selectedBgTab === 'drapery' && (
                    <div className="space-y-2.5">
                      <p className="text-neutral-300 leading-relaxed text-[11px]">
                        Mount heavy, triple-layered blackouts or velvet drapes. Draping rich fabrics builds a high-end luxury backdrop that improves color palette richness. Most importantly, thick drapes heavily dampen high-pitched room echoes for peak stream microphone audio.
                      </p>
                      <p className="text-[10px] text-brand-lime font-mono italic leading-relaxed">
                        ★ Pro Management Tip: Ensure fabrics are steamed prior to auditions. Wrinkled textiles look highly unprofessional and messy under strong casting keys.
                      </p>
                    </div>
                  )}

                </div>
              </div>
            </div>

          </div>
        </div>
        </>
      )}

      {/* Mode 2: Coordinator casting management view */}
      {currentMode === 'admin' && (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in" id="admin-mode-box">
          
          {/* Schedulers & bookings roster */}
          <div className="lg:col-span-4 bg-neutral-950 border border-white/10 p-5 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider font-display flex items-center justify-between mb-2">
              <span>Auditions Queue</span>
              <span className="text-[10px] font-mono text-neutral-400 font-normal">{auditions.length} recorded</span>
            </h3>

            <div className="flex items-center justify-between gap-1 text-[9px] font-mono text-neutral-500 uppercase pb-2 border-b border-white/5">
              <span>⏰ Dynamic Timers: Active</span>
              <span className={`animate-pulse font-bold ${currentTheme.accentText}`}>● Ticking 30s</span>
            </div>

            <button
              onClick={handleDownloadCSV}
              type="button"
              className={`w-full py-2 px-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition border cursor-pointer rounded-none hover:bg-white/[0.03] active:scale-[0.98] ${currentTheme.badge}`}
              id="download-csv-roster-btn"
            >
              <Download className="w-3.5 h-3.5" />
              Download CSV Report
            </button>

            {auditions.length === 0 ? (
              <div className="text-center py-10 text-xs text-neutral-500 font-mono">
                No active scheduled auditions found.
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 text-xs">
                {auditions.map((aud) => {
                  const alertInfo = getUpcomingAlert(aud.scheduledTime);
                  const isUpcoming24h = alertInfo && alertInfo.isUpcoming;

                  return (
                    <button
                      key={aud.id}
                      type="button"
                      onClick={() => handleSelectAuditionForReview(aud)}
                      className={`w-full text-left p-3 rounded-none transition flex items-center justify-between border relative overflow-hidden ${
                        selectedAudition?.id === aud.id
                          ? 'bg-purple-950/15 border-purple-800/60'
                          : 'bg-neutral-900/60 border-transparent hover:bg-neutral-800/60'
                      } ${
                        isUpcoming24h 
                          ? alertInfo.isCritical
                            ? 'border-l-3 border-l-red-500 bg-red-500/[0.01]'
                            : 'border-l-3 border-l-amber-400 bg-amber-450/[0.01]'
                          : ''
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-white uppercase font-sans tracking-wide">{aud.applicantName}</h4>
                          {isUpcoming24h && (
                            <span className="relative flex h-2 w-2">
                              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                alertInfo.isCritical ? 'bg-red-400' : 'bg-amber-400'
                              }`}></span>
                              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                                alertInfo.isCritical ? 'bg-red-500' : 'bg-amber-500'
                              }`}></span>
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-neutral-400 font-mono mt-0.5">{aud.category}</p>
                        <p className="text-[9px] text-zinc-500 font-mono mt-1">
                          Slot: {new Date(aud.scheduledTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(aud.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {isUpcoming24h && (
                          <div className={`mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 border text-[9px] font-mono uppercase tracking-wide rounded ${alertInfo.colorClass}`}>
                            <Clock className="w-2.5 h-2.5 flex-shrink-0 text-white/70" />
                            <span>T-MINUS: {alertInfo.label}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-right space-y-1 flex flex-col items-end">
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border uppercase font-bold ${
                          aud.status === 'pending' ? 'bg-purple-950/20 text-purple-400 border-purple-900/30' :
                          aud.status === 'scheduled' ? 'bg-indigo-950/30 text-indigo-400 border-indigo-900/30' :
                          aud.status === 'live' ? 'bg-green-950/30 text-green-400 border-green-930/30 font-black animate-pulse' :
                          aud.status === 'completed' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/30' :
                          'bg-slate-950/30 text-slate-400 border-slate-900/30'
                        }`}>
                          {aud.status}
                        </span>
                        {aud.overallRating > 0 && (
                          <span className="text-[9px] text-zinc-400 font-mono bg-neutral-950 px-1 border border-white/10">Graded {aud.overallRating}%</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Interactive Evaluation Room & Diagnostics controls */}
          <div className="lg:col-span-8 space-y-6">
            {selectedAudition ? (
              <div className="bg-neutral-950 border border-white/10 p-6 space-y-6">
                
                {/* Header Information */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-4 gap-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-black text-white uppercase tracking-tight font-display">{selectedAudition.applicantName}</h3>
                      {(() => {
                        const alertInfo = getUpcomingAlert(selectedAudition.scheduledTime);
                        if (!alertInfo || !alertInfo.isUpcoming) return null;
                        return (
                          <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded border uppercase font-mono tracking-wider ${alertInfo.colorClass}`}>
                            <Clock className="w-3 h-3 flex-shrink-0" />
                            {alertInfo.label}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-xs text-brand-lime font-mono">Reference email: {selectedAudition.email} • ID: {selectedAudition.applicantId}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteAudition(selectedAudition.id)}
                    className="text-neutral-500 hover:text-red-400 p-1 font-mono text-xs flex items-center gap-1 uppercase transition"
                    title="Remove Session record"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> delete slot
                  </button>
                </div>

                {/* Substantive Audition Stream Simulator / diagnostics check */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                  
                  {/* Webcast monitor screen */}
                  <div className="bg-neutral-900 border border-white/10 aspect-video flex flex-col justify-between p-3 relative overflow-hidden">
                    {isAdminViewingFeed ? (
                      <div className="absolute inset-0 bg-neutral-950 flex flex-col justify-between p-3">
                        {/* Simulated green live preview or candidate video if permitted */}
                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-500 text-black font-mono font-bold text-[8px] py-0.5 px-1.5 animate-pulse rounded-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
                          LIVE FEED SOURCE
                        </div>

                        {/* Scrolling Console Diagnostics metadata */}
                        <div className="space-y-1 font-mono text-[9px] text-green-400 leading-normal max-h-36 overflow-y-auto mt-4 pr-1">
                          <p className="text-white font-bold">--- DECODER PIPELINES ACTIVE ---</p>
                          {feedLogs.map((log, index) => (
                            <p key={index} className="truncate">► {log}</p>
                          ))}
                        </div>

                        <div className="border-t border-white/10 pt-2 flex justify-between font-mono text-[9px] text-zinc-500">
                          <span>Bitrate: {selectedAudition.streamBandwidth || '6.2 Mbps'}</span>
                          <span>Webcam: {selectedAudition.testWebcamQuality || 'Standard HD Wide'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
                        <Video className="w-10 h-10 text-neutral-700 mb-2" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Stream signal offline</span>
                        <button
                          type="button"
                          onClick={launchMonitorFeed}
                          className="mt-3 py-1.5 px-3 bg-brand-lime text-black font-black uppercase tracking-wider text-[10px]"
                        >
                          ✦ Monitor Live Video
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Settings and status overrides */}
                  <div className="space-y-4">
                    <div className="bg-neutral-900 border border-white/5 p-4 rounded-none space-y-3 font-sans text-xs">
                      <span className="text-xs font-bold text-white block uppercase tracking-wider font-mono">Stream Quality Check</span>
                      <p className="text-zinc-400 leading-relaxed text-[11px]">
                        The candidate's registered webcam class is reported as <strong className="text-white">{selectedAudition.testWebcamQuality || "HD USB Capture"}</strong> with matching network upload speed <strong className="text-white">{selectedAudition.streamBandwidth || "Fiber Core"}</strong>. Ensure these parameters clear baseline minimum benchmarks.
                      </p>
                      
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-bold text-neutral-400 font-mono tracking-wider block">Audition Lifecycle Stage</label>
                        <select
                          value={mgmtStatus}
                          onChange={(e) => setMgmtStatus(e.target.value as any)}
                          className="w-full bg-neutral-950 border border-white/10 p-2 text-xs text-white uppercase focus:border-brand-lime cursor-pointer font-mono font-bold"
                        >
                          <option value="pending">pending (awaiting stream)</option>
                          <option value="scheduled">scheduled</option>
                          <option value="live">live stream active</option>
                          <option value="completed">completed & graduated</option>
                          <option value="canceled">canceled / missed</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score slider sheets */}
                <div className="border-t border-white/10 pt-6 space-y-4">
                  <span className="text-xs font-bold text-slate-200 block font-mono uppercase tracking-widest flex items-center gap-1">
                    <Sliders className="w-4 h-4 text-brand-lime" />
                    Management Audition Grade Metric SHEET
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-mono">
                    
                    {/* Lighting Score Slider */}
                    <div className="space-y-2 bg-neutral-900 border border-white/5 p-4 rounded-none">
                      <div className="flex justify-between items-center text-slate-350">
                        <span className="font-extrabold uppercase text-[9px] tracking-wider text-neutral-400">1. HD Camera & Lighting</span>
                        <span className="text-brand-lime">{mgmtLighting}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={mgmtLighting}
                        onChange={(e) => setMgmtLighting(Number(e.target.value))}
                        className="w-full h-1 bg-neutral-950 rounded-none appearance-none focus:outline-none accent-brand-lime cursor-pointer"
                      />
                      <p className="text-[9px] text-zinc-500 font-sans leading-normal">Webcam clarity, autofocus stabilization, ringlight framing.</p>
                    </div>

                    {/* Interactive Speech Score Slider */}
                    <div className="space-y-2 bg-neutral-900 border border-white/5 p-4 rounded-none">
                      <div className="flex justify-between items-center text-slate-350">
                        <span className="font-extrabold uppercase text-[9px] tracking-wider text-neutral-400">2. Vocal Speech & ASMR</span>
                        <span className="text-brand-lime">{mgmtInteractive}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={mgmtInteractive}
                        onChange={(e) => setMgmtInteractive(Number(e.target.value))}
                        className="w-full h-1 bg-neutral-950 rounded-none appearance-none focus:outline-none accent-brand-lime cursor-pointer"
                      />
                      <p className="text-[9px] text-zinc-500 font-sans leading-normal">Microphone latency check, English fluency, conversation warmth.</p>
                    </div>

                    {/* Styling Score Slider */}
                    <div className="space-y-2 bg-neutral-900 border border-white/5 p-4 rounded-none">
                      <div className="flex justify-between items-center text-slate-350">
                        <span className="font-extrabold uppercase text-[9px] tracking-wider text-neutral-400">3. Presentation Styling</span>
                        <span className="text-brand-lime">{mgmtStyling}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={mgmtStyling}
                        onChange={(e) => setMgmtStyling(Number(e.target.value))}
                        className="w-full h-1 bg-neutral-950 rounded-none appearance-none focus:outline-none accent-brand-lime cursor-pointer"
                      />
                      <p className="text-[9px] text-zinc-500 font-sans leading-normal">Cosmetics, theme costumes, stream background environment pairing.</p>
                    </div>
                  </div>

                  {/* Coaching notes */}
                  <div className="space-y-1.5 flex flex-col pt-2 text-xs">
                    <label className="text-[10px] uppercase font-bold text-neutral-400 font-mono tracking-wider">Management Coaching Recommendations</label>
                    <textarea
                      placeholder="Type specific performance tutoring notes, ringlight adjustments, geoblocking rules customization instructions..."
                      rows={3}
                      value={mgmtCoaching}
                      onChange={(e) => setMgmtCoaching(e.target.value)}
                      className="w-full bg-neutral-900 border border-white/10 p-3 text-xs text-white focus:border-brand-lime focus:outline-none font-sans"
                    />
                    <p className="text-[9px] text-neutral-500 leading-normal">These coaching recommendations are synchronized instantly and visible to the applicant inside their Portal practice dashboard.</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveCastingAssessment}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-extrabold uppercase tracking-wider text-xs shadow-lg shadow-purple-900/10 transition cursor-pointer"
                  >
                    Commit Casting Roster Evaluation
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-neutral-950 border border-white/10 p-12 text-center text-slate-500 text-xs flex flex-col justify-center items-center h-full min-h-[300px]">
                <FileText className="w-12 h-12 text-neutral-800 mb-2" />
                <span className="font-sans">Select a candidate's timed slot in the left queue to view stream diagnostics, launch video monitoring, evaluate presentation styles, and type technical recommendations.</span>
              </div>
            )}
          </div>
        </div>

        {/* Visual Divider */}
        <div className="border-t border-white/10 my-8 pt-8" id="outreach-separator"></div>

        {/* Model Outreach & Link Obfuscation Workspace */}
        <div className="bg-neutral-950 border border-white/10 p-6 md:p-8 space-y-6" id="coordinator-outreach-workspace">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-4 gap-4">
            <div>
              <span className="text-[10px] text-purple-400 font-mono font-black uppercase tracking-[0.2em] block">RECRUITER ACQUISITION KIT</span>
              <h3 className="text-lg md:text-xl font-black font-display text-white uppercase mt-1 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-brand-lime" />
                Outreach Link Camouflage & Script Templates
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Obfuscate the .run.app URL using custom shorteners and copy high-conversion scripts optimized to bypass automated chat blocks on cam websites.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-neutral-900 border border-white/5 py-1.5 px-3">
              <span className="w-2 h-2 rounded-full bg-brand-lime animate-pulse"></span>
              <span className="text-[10px] text-zinc-400 font-mono">Bypass Shields Live: NORMAL</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Panel: Link Wrapping & Obfuscation Options */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-3 flex items-center gap-1.5">
                  <Link className="w-4 h-4 text-brand-lime" />
                  1. URL Obfuscation & CAMOUFLAGE Customizer
                </h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed mb-4">
                  Many cam-directories (such as OnlyFans, Jasmin, Chaturbate, Stripchat) auto-flag or censor direct links containing <code className="text-red-400 bg-neutral-900 px-1 py-0.2 rounded font-mono">.run.app</code>. Use these safe links or set up cloaked URL forwarding to safeguard high-deliverability DMs.
                </p>
              </div>

              {/* Primary app link configuration */}
              <div className="bg-neutral-900 border border-white/5 p-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider font-mono block">Primary Acquisition Link (Destination)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={getAppUrl()}
                      className="flex-grow bg-neutral-950 border border-white/10 p-2.5 text-xs text-zinc-400 font-mono focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyText(getAppUrl(), 'primary-link')}
                      className="px-3 bg-neutral-800 text-white hover:bg-neutral-700 transition flex items-center justify-center border border-white/5"
                      title="Copy Primary Link"
                    >
                      {copiedId === 'primary-link' ? 'Copied' : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* TinyURL direct creator helper */}
                <div className="space-y-3 pt-2 border-t border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-300 font-mono uppercase tracking-wide">Option A: TinyURL API Link Shortener</span>
                    <span className="text-[9px] text-zinc-500 font-mono uppercase">Developer API</span>
                  </div>
                  
                  <p className="text-[10px] text-neutral-400 leading-normal">
                    We have integrated an automated URL shortener. Customize your slug below, verify your API token, and click <strong>Create Short Link</strong> to generate it in one click!
                  </p>

                  <div className="space-y-2 bg-neutral-950 p-3 border border-white/5">
                    <div className="space-y-1">
                      <label className="text-[8px] uppercase font-bold text-neutral-400 font-mono tracking-wider block">TinyURL API Token</label>
                      <input
                        type="password"
                        placeholder="Enter API token here..."
                        value={tinyurlApiKey}
                        onChange={(e) => setTinyurlApiKey(e.target.value)}
                        className="w-full bg-neutral-900 border border-white/10 p-2 text-xs text-brand-lime font-mono focus:border-brand-lime focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 items-end">
                      <div className="space-y-1">
                        <label className="text-[8px] uppercase font-bold text-neutral-400 font-mono tracking-wider block">Custom Suffix (Slug)</label>
                        <input
                          type="text"
                          placeholder="vivid-talent-apply"
                          value={customShortSlug}
                          onChange={(e) => {
                            setCustomShortSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''));
                            setShortenedUrl(''); // Reset active short link if slug changes
                          }}
                          className="w-full bg-neutral-900 border border-white/10 p-2 text-xs text-white font-mono focus:border-brand-lime focus:outline-none"
                        />
                      </div>
                      
                      <button
                        type="button"
                        disabled={isShortening}
                        onClick={handleShortenUrl}
                        className="w-full py-2.5 px-3 bg-brand-lime disabled:bg-neutral-800 disabled:text-zinc-650 hover:bg-brand-lime/90 text-black font-black uppercase text-[10px] tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {isShortening ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin text-zinc-950" />
                            Creating Link...
                          </>
                        ) : (
                          <>
                            Create Short Link
                            <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
                          </>
                        )}
                      </button>
                    </div>

                    {shortenError && (
                      <div className="text-[10px] text-red-400 font-mono bg-red-950/20 border border-red-900/30 p-2 mt-2">
                        ⚠️ Err: {shortenError}
                      </div>
                    )}

                    {shortenedUrl ? (
                      <div className="bg-brand-lime/10 border border-brand-lime/30 p-2.5 mt-2.5 space-y-1">
                        <span className="text-[9px] uppercase font-bold text-brand-lime tracking-wider block">🎉 Short Link Created!</span>
                        <div className="flex justify-between items-center gap-2">
                          <span className="font-mono text-[11px] text-white select-all truncate">{shortenedUrl}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(shortenedUrl, 'created-short')}
                            className="text-[9px] uppercase font-mono font-bold bg-brand-lime text-black px-2.5 py-1 rounded"
                          >
                            {copiedId === 'created-short' ? 'Copied!' : 'Copy Link'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-neutral-900 border border-white/5 p-2 font-mono text-[10px] text-zinc-500 flex justify-between items-center mt-2.5">
                        <span className="truncate">Proposed URL: <strong className="text-zinc-350">tinyurl.com/{customShortSlug || 'vivid-casting-apply'}</strong></span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(`tinyurl.com/${customShortSlug || 'vivid-casting-apply'}`, 'proposed-tiny')}
                          className="text-brand-lime hover:text-white transition font-bold"
                        >
                          {copiedId === 'proposed-tiny' ? 'Copied' : 'Copy proposed link'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Free micro-landing page services */}
                <div className="space-y-2 pt-3 border-t border-white/5">
                  <span className="text-[10px] font-bold text-slate-300 font-mono uppercase tracking-wide block">Option B: Camouflage Landing Page (100% Safe)</span>
                  <p className="text-[10px] text-neutral-400 leading-normal">
                    The absolute safest bypass is creating a free **Linktree, Beacons.ai, or Carrd.co** page. Put your designated redirection button on your bio page, and send models your Linktree profile link. Since link-aggregators are universally allowed on all cam and chat platforms:
                  </p>
                  <ul className="text-[9px] text-zinc-500 space-y-1 pl-4 list-disc font-sans leading-relaxed">
                    <li>Linktree links are permitted directly in OnlyFans and cam site bio settings</li>
                    <li>Allows you to list your agency contact handles (Telegram, WhatsApp) safely beside the signup web form</li>
                    <li>Avoids direct algorithmic domain flagging via messaging chat filters</li>
                  </ul>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href="https://linktr.ee/"
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-neutral-950 hover:bg-neutral-850 border border-white/5 hover:border-white/20 transition-all font-mono text-[9px] text-white flex items-center justify-between"
                    >
                      <span>➔ Set Up Linktree</span>
                      <ExternalLink className="w-2.5 h-2.5 text-zinc-500" />
                    </a>
                    <a
                      href="https://beacons.ai/"
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-neutral-950 hover:bg-neutral-850 border border-white/5 hover:border-white/20 transition-all font-mono text-[9px] text-white flex items-center justify-between"
                    >
                      <span>➔ Set Up Beacons</span>
                      <ExternalLink className="w-2.5 h-2.5 text-zinc-500" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel: Pitch templates and variable injector */}
            <div className="lg:col-span-6 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-3 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-brand-lime" />
                  2. High-Converting Direct Outreach Scripts
                </h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed mb-4">
                  These templates dynamically insert your parameters in real-time. Choose templates optimized for different delivery channels and click Copy to capture ready-to-send texts.
                </p>
              </div>

              {/* Variable Overrides */}
              <div className="bg-neutral-900 border border-white/5 p-4 rounded-none grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                <div className="space-y-1.5">
                  <label className="text-[8px] uppercase font-bold text-neutral-400 font-mono tracking-wider">Recruiter Name override</label>
                  <input
                    type="text"
                    value={outreachName}
                    onChange={(e) => setOutreachName(e.target.value)}
                    className="w-full bg-neutral-950 border border-white/10 p-2 text-xs text-white focus:border-brand-lime focus:outline-none font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[8px] uppercase font-bold text-neutral-400 font-mono tracking-wider">Bonus / Offer highlight</label>
                  <input
                    type="text"
                    value={outreachBonus}
                    onChange={(e) => setOutreachBonus(e.target.value)}
                    className="w-full bg-neutral-950 border border-white/10 p-2 text-xs text-white focus:border-brand-lime focus:outline-none font-sans"
                  />
                </div>
              </div>

              {/* Templates Board */}
              <div className="space-y-4">
                {(() => {
                  const rawShort = shortenedUrl ? shortenedUrl.replace(/^https?:\/\//, '') : `tinyurl.com/${customShortSlug || 'vivid-casting-apply'}`;
                  const dynamicLink = shortenedUrl || `tinyurl.com/${customShortSlug || 'vivid-casting-apply'}`;
                  const spacedShortUrl = rawShort.split('').join(' ');

                  const templates = [
                    {
                      id: "of-highpayout",
                      title: "STEALTH REGEX BYPASS (Bypasses auto-link block in cam chats)",
                      desc: "Uses spaced characters to slide past live chat filters on platforms that auto-censor words like '.com' or standard links.",
                      msg: `Hey! Love your stream style and energy. I represent Vivid Agency casting division (our team does lighting adjustments, stream hardware sponsorships, and high-payout setups with a guaranteed ${outreachBonus}).

We are currently booking video diagnostics trials for cammers. Feel free to register or run a test stream at:
v i v i d - c a s t i n g . r u n . a p p  (just remove the spaces!)
OR check out our info page at:
${spacedShortUrl} (remove spaces)

Reach out if you have any questions! - ${outreachName}`
                    },
                    {
                      id: "value-pitch",
                      title: "HIGH-VALUE AGENCY PITCH (Direct FanMail / OF Inbox)",
                      desc: "Professional pitch emphasizing stream hardware support, lighting tutorials, and safe payment channels.",
                      msg: `Hi there,

Hope you are having a wonderful streaming week! I'm ${outreachName} with Vivid Casting. We sponsor premium webcam hardware, high-end warm ringlights, and custom geoblocking protocols to allow models to stream anonymously and safely.

We currently have a limited booking call with a ${outreachBonus} on signup. Check out our real-time webcam diagnostics room and book a quick simulation.

Direct casting link:
${dynamicLink}

Best regards,
${outreachName}
Vivid Talent Operations Team`
                    },
                    {
                      id: "casual-social",
                      title: "CASUAL SOCIAL DM (Instagram / TikTok DM)",
                      desc: "Casual, friendly tone to test interest before dropping detailed technical casting specs.",
                      msg: `Hey! I just found your content and think your look is absolutely amazing ✦

I work with Vivid Agency – we help up-and-coming models secure top-tier traffic pools and premium sponsors. We're currently booking diagnostic auditions with a ${outreachBonus} inside our portal.

If you are interested in seeing standard specs, check out our diagnostic tools page:
👉 ${dynamicLink}

I'd love to chat more! Let me know if you submit a form. - ${outreachName}`
                    }
                  ];

                  return templates.map((tmpl) => (
                    <div key={tmpl.id} className="bg-neutral-900 border border-white/5 p-4 space-y-2 text-left">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-[10px] font-bold text-brand-lime font-mono uppercase tracking-wider">{tmpl.title}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(tmpl.msg, tmpl.id)}
                          className={`text-[9px] uppercase font-mono font-bold border px-2.5 py-1 transition flex items-center gap-1 ${
                            copiedId === tmpl.id
                              ? 'bg-brand-lime text-black border-brand-lime'
                              : 'bg-neutral-950 border-white/10 text-slate-300 hover:text-white hover:bg-neutral-900'
                          }`}
                        >
                          <Copy className="w-2.5 h-2.5" />
                          {copiedId === tmpl.id ? 'Copied!' : 'Copy Script'}
                        </button>
                      </div>
                      <p className="text-[9px] text-zinc-500 italic font-sans">{tmpl.desc}</p>
                      <div className="bg-neutral-950 p-2.5 border border-white/5 font-mono text-[11px] text-zinc-300 rounded-none whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                        {tmpl.msg}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
