import React, { useState } from 'react';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  User, Mail, Calendar, MapPin, 
  Video, Globe, Wifi, Briefcase, 
  CheckCircle, FileText, UploadCloud, 
  ShieldCheck, Loader2, ArrowLeft, ArrowRight
} from 'lucide-react';

const CATEGORIES = [
  "Interactive Chatting",
  "Cosplay & Theme",
  "Dance & Artistic",
  "Gaming & Play",
  "ASMR & Whispering",
  "Other Creative Niche"
];

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200"
];

interface ApplicationFormProps {
  onRegistrationSuccess?: (applicant: {
    id: string;
    displayName: string;
    email: string;
    primaryCategory: string;
  }) => void;
  onGoToAuditions?: () => void;
}

export default function ApplicationForm({ onRegistrationSuccess, onGoToAuditions }: ApplicationFormProps) {
  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [registeredId, setRegisteredId] = useState<string>('');
  
  // Form State
  const [fullName, setFullName] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [age, setAge] = useState<number>(20);
  const [location, setLocation] = useState<string>('');
  const [primaryCategory, setPrimaryCategory] = useState<string>(CATEGORIES[0]);
  const [languages, setLanguages] = useState<string>('');
  const [internetSpeed, setInternetSpeed] = useState<string>('');
  const [experience, setExperience] = useState<string>('');
  const [introduction, setIntroduction] = useState<string>('');
  
  // Simulated File Uploads
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idUploading, setIdUploading] = useState<boolean>(false);
  const [idUploaded, setIdUploaded] = useState<boolean>(false);
  
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUploading, setPhotoUploading] = useState<boolean>(false);
  const [photoUrl, setPhotoUrl] = useState<string>(PRESET_AVATARS[0]);
  
  const [ageConsent, setAgeConsent] = useState<boolean>(false);

  // Handle fake ID file upload
  const handleIdUploadFake = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIdFile(file);
      setIdUploading(true);
      setTimeout(() => {
        setIdUploading(false);
        setIdUploaded(true);
      }, 1500);
    }
  };

  // Handle photo upload (allows preset selection or mock file choice)
  const handlePhotoUploadFake = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoUploading(true);
      setTimeout(() => {
        setPhotoUploading(false);
        // Create localized mock URL
        const simulatedUrl = URL.createObjectURL(file);
        setPhotoUrl(simulatedUrl);
      }, 1500);
    }
  };

  const validateStep = () => {
    if (step === 1) {
      if (!fullName || fullName.trim().length < 2) return "Please enter your legal full name.";
      if (!displayName || displayName.trim().length < 2) return "Please choose a professional webcam screen name.";
      if (!email || !email.includes('@')) return "Please enter a valid email address.";
      if (age < 18) return "You must be 18 years or older to apply.";
    } else if (step === 2) {
      if (!location || location.trim().length < 2) return "Please provide your active location (Country/State).";
    } else if (step === 4) {
      if (!idUploaded && !idFile) return "Verification document upload is required.";
      if (!ageConsent) return "You must consent to age authentication.";
    }
    return null;
  };

  const handleNext = () => {
    const error = validateStep();
    if (error) {
      alert(error);
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    setStep((prev) => prev - 1);
  };

  // Submit Application
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateStep();
    if (error) {
      alert(error);
      return;
    }

    setSubmitting(true);
    const applicantId = 'app_' + Math.random().toString(36).substring(2, 11);
    
    const payload = {
      fullName: fullName.trim(),
      displayName: displayName.trim(),
      email: email.trim().toLowerCase(),
      age: Number(age),
      location: location.trim(),
      primaryCategory,
      languages: languages.trim() || "English",
      internetSpeed: internetSpeed || "Standard Connection",
      experience: experience || "New Talent",
      introduction: introduction.trim(),
      photoUrl,
      status: 'new' as const,
      createdAt: serverTimestamp()
    };

    try {
      // Secure write: conforms to our strict rules (status MUST be 'new', notes and score absent on create)
      await setDoc(doc(db, 'applicants', applicantId), payload);
      setRegisteredId(applicantId);
      setSubmitted(true);
      setSubmitting(false);
      if (onRegistrationSuccess) {
        onRegistrationSuccess({
          id: applicantId,
          displayName: displayName.trim(),
          email: email.trim().toLowerCase(),
          primaryCategory
        });
      }
    } catch (err) {
      setSubmitting(false);
      handleFirestoreError(err, OperationType.CREATE, `applicants/${applicantId}`);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white text-black p-8 md:p-12 text-center max-w-xl mx-auto shadow-2xl relative overflow-hidden border-t-8 border-brand-lime rounded-none" id="application-success-box">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-lime flex items-center justify-center text-black mb-6 rounded-none">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h3 className="text-2xl md:text-3xl font-black font-display uppercase tracking-tight text-white-outline text-black">Application Submitted!</h3>
        <p className="text-sm text-neutral-600 mt-3 leading-relaxed font-sans">
          Thank you for applying, <strong className="text-black font-bold uppercase">{displayName}</strong>. Our recruiting staff will review your age credentials and stream preferences within 24 hours.
        </p>
        <div className="bg-neutral-50 border border-neutral-200 p-6 mt-6 text-left space-y-3 font-mono text-xs text-neutral-750">
          <p><span className="text-black font-extrabold font-sans uppercase">► Stage Name:</span> {displayName}</p>
          <p><span className="text-black font-extrabold font-sans uppercase">► Category:</span> {primaryCategory}</p>
          <p><span className="text-black font-extrabold font-sans uppercase">► Reference ID:</span> <span className="font-extrabold tracking-widest select-all bg-neutral-200 text-black px-1.5 py-0.5 rounded">{registeredId}</span></p>
          <p><span className="text-black font-extrabold font-sans uppercase">► Status:</span> <span className="text-black font-black bg-brand-lime px-2 py-0.5 border border-black rounded-none">NEW (PENDING)</span></p>
          <p className="text-[11px] text-neutral-500 leading-relaxed font-sans pt-1">Our system has processed your file securely. Please copy your **Reference ID** above for booking and stream diagnostics validation.</p>
        </div>

        {onGoToAuditions && (
          <button
            type="button"
            onClick={onGoToAuditions}
            className="mt-6 w-full py-4 bg-brand-lime text-black font-black uppercase tracking-widest text-xs hover:scale-[0.98] transition-all rounded-none cursor-pointer border-2 border-black font-sans"
          >
            ✦ Schedule & Practice Audition Stream (Next Step)
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            // Reset form
            setStep(1);
            setSubmitted(false);
            setFullName('');
            setDisplayName('');
            setEmail('');
            setLocation('');
            setLanguages('');
            setIntroduction('');
            setIdFile(null);
            setIdUploaded(false);
            setAgeConsent(false);
          }}
          className="mt-3 w-full py-2 bg-neutral-100 text-neutral-600 font-bold uppercase tracking-wider text-[9px] hover:bg-neutral-200 transition rounded-none cursor-pointer"
        >
          Submit Another Application
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white text-black p-6 md:p-10 max-w-2xl mx-auto shadow-2xl relative border-t-8 border-brand-lime rounded-none" id="recruitment-form-container">
      {/* Step Progress Header */}
      <div className="mb-8 border-b border-zinc-100 pb-5">
        <div className="flex justify-between text-[10px] text-zinc-500 font-mono mb-2 uppercase font-extrabold tracking-widest">
          <span>Step {step} of 4</span>
          <span className="text-black">
            {step === 1 && "Identity & Verification Details"}
            {step === 2 && "Aesthetic & Stream Style"}
            {step === 3 && "Equipment & Technical Fit"}
            {step === 4 && "Legal Compliance & Bio"}
          </span>
        </div>
        <div className="w-full bg-zinc-200 h-1.5 rounded-none overflow-hidden">
          <div 
            className="bg-black h-1.5 rounded-none transition-all duration-300"
            style={{ width: `${(step / 4) * 105 / 105}%` }}
          ></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* STEP 1: LEGAL & SIGNUP IDENTITIES */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in text-black" id="form-step-1">
            <h3 className="text-lg font-black uppercase text-black font-display tracking-tight flex items-center gap-2">
              <User className="text-black w-5 h-5 stroke-[2.5]" />
              General Contact & ID Info
            </h3>
            
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-black tracking-widest font-mono block">Legal Full Name (Confidential)</label>
              <input
                type="text"
                required
                placeholder="Jessica Sterling"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border-b-2 border-black py-2.5 focus:outline-none bg-transparent placeholder:text-neutral-300 text-black text-sm font-semibold rounded-none"
              />
              <p className="text-[10px] text-zinc-500 leading-normal pt-1">
                For legal background check and Model payout/payroll processing only. This information matches your physical ID card and is strictly kept confidential.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-black tracking-widest font-mono block">Model Stage Name (Public)</label>
                <input
                  type="text"
                  required
                  placeholder="ALEXA_VIBE"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full border-b-2 border-black py-2.5 focus:outline-none bg-transparent placeholder:text-neutral-300 text-black text-sm font-semibold rounded-none"
                />
                <p className="text-[10px] text-zinc-500 leading-normal pt-1">Your stream handle displayed publicly to platform token buyers.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-black tracking-widest font-mono block">Age (Must be 18+)</label>
                <input
                  type="number"
                  required
                  min="18"
                  max="100"
                  placeholder="21"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full border-b-2 border-black py-2.5 focus:outline-none bg-transparent placeholder:text-neutral-300 text-black text-sm font-semibold rounded-none"
                />
                <p className="text-[10px] text-zinc-500 leading-normal pt-1">Majority status is strictly authenticated via ID verification.</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-black tracking-widest font-mono block">Contact Email Address</label>
              <input
                type="email"
                required
                placeholder="model@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-b-2 border-black py-2.5 focus:outline-none bg-transparent placeholder:text-neutral-300 text-black text-sm font-semibold rounded-none"
              />
              <p className="text-[10px] text-zinc-500 leading-normal pt-1">We send booking schedules and confidential setup guides here.</p>
            </div>
          </div>
        )}

        {/* STEP 2: CATEGORY & PREFERENCES */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in text-black" id="form-step-2">
            <h3 className="text-lg font-black uppercase text-black font-display tracking-tight flex items-center gap-2">
              <Video className="text-black w-5 h-5 stroke-[2.5]" />
              Aesthetics & Language Choices
            </h3>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-black tracking-widest font-mono block">Primary Style / Category</label>
              <select
                value={primaryCategory}
                onChange={(e) => setPrimaryCategory(e.target.value)}
                className="w-full border-b-2 border-black py-2.5 focus:outline-none bg-transparent text-black text-sm font-semibold rounded-none cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="text-black bg-white">{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-black tracking-widest font-mono block">Location (City & Country)</label>
              <input
                type="text"
                required
                placeholder="e.g. Barcelona, Spain"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full border-b-2 border-black py-2.5 focus:outline-none bg-transparent placeholder:text-neutral-300 text-black text-sm font-semibold rounded-none"
              />
              <p className="text-[10px] text-zinc-500 leading-normal pt-1">Useful to configure geo-blocking privacy shields (completely conceals your stream inside designated locations).</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-black tracking-widest font-mono block">Languages Conforming / Spoken</label>
              <input
                type="text"
                placeholder="e.g. English, Fluent Spanish"
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
                className="w-full border-b-2 border-black py-2.5 focus:outline-none bg-transparent placeholder:text-neutral-300 text-black text-sm font-semibold rounded-none"
              />
              <p className="text-[10px] text-zinc-500 leading-normal pt-1">Bilingual models receive higher search rankings and boosted token payouts.</p>
            </div>
          </div>
        )}

        {/* STEP 3: TECH & EQUIPMENT */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in text-black" id="form-step-3">
            <h3 className="text-lg font-black uppercase text-black font-display tracking-tight flex items-center gap-2">
              <Wifi className="text-black w-5 h-5 stroke-[2.5]" />
              Technical Setup & Background
            </h3>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-black tracking-widest font-mono block">Internet Upload Speed</label>
              <select
                value={internetSpeed}
                onChange={(e) => setInternetSpeed(e.target.value)}
                className="w-full border-b-2 border-black py-2.5 focus:outline-none bg-transparent text-black text-sm font-semibold rounded-none cursor-pointer"
              >
                <option value="" className="text-black bg-white">-- Choose Internet Class --</option>
                <option value="High Speed (Fiber 100+ Mbps upload)" className="text-black bg-white">High Speed Fiber (100+ Mbps upload)</option>
                <option value="Standard cable (15-50 Mbps upload)" className="text-black bg-white">Standard cable (15-50 Mbps)</option>
                <option value="Mobile hotspot / DSL (Low Speed)" className="text-black bg-white">Broadband Hotspot (Less than 15 Mbps)</option>
              </select>
              <p className="text-[10px] text-zinc-500 pt-1 leading-normal">High-definition 1080p camera streaming requires at least 15Mbps upload capacity.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-black tracking-widest font-mono block">Prior Webcam/Modeling Experience</label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full border-b-2 border-black py-2.5 focus:outline-none bg-transparent text-black text-sm font-semibold rounded-none cursor-pointer"
              >
                <option value="" className="text-black bg-white">-- Choose your experience tier --</option>
                <option value="None / Complete Beginner" className="text-black bg-white">None / Complete Beginner (Free Training Offered)</option>
                <option value="Under 1 year" className="text-black bg-white">Under 1 year of independent streaming</option>
                <option value="1 to 3 Years" className="text-black bg-white">1 - 3 years professional modeling</option>
                <option value="3+ Years experienced" className="text-black bg-white">3+ years expert streamer (Pre-built fans)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-black tracking-widest font-mono block">Tell us about your streaming goals</label>
              <textarea
                placeholder="Write a brief cover letter or introduction. What are your aspirations? What features or hobbies do you enjoy sharing? Mention if you need setup equipment."
                rows={4}
                value={introduction}
                onChange={(e) => setIntroduction(e.target.value)}
                className="w-full border-2 border-black p-3 text-sm text-black bg-neutral-50 focus:bg-white focus:outline-none font-sans rounded-none font-semibold leading-relaxed"
              />
              <p className="text-[10px] text-zinc-500">Maximum 2,000 characters.</p>
            </div>
          </div>
        )}

        {/* STEP 4: LEGAL COMPLIANCE & VERIFICATION */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in text-black" id="form-step-4">
            <h3 className="text-lg font-black uppercase text-black font-display tracking-tight flex items-center gap-2">
              <ShieldCheck className="text-black w-5 h-5 stroke-[2.5]" />
              ID verification & Onboarding Profile
            </h3>

            {/* Simulated verification uploads mock */}
            <div className="border-2 border-black bg-neutral-50 rounded-none p-5 space-y-4">
              <div>
                <span className="text-[10px] font-mono font-black text-black uppercase tracking-wider block">Age Verification Gate (Confidential)</span>
                <p className="text-xs text-zinc-650 leading-relaxed mt-1">
                  We are required by global internet regulatory authorities to explicitly verify that all modeling personnel are of adult status (18+). Please upload a clear photo of your government-issued ID (Passport, Driver License, or ID Card). 
                </p>
              </div>

              {/* Upload ID File Interface */}
              <div className="relative">
                <input
                  type="file"
                  id="id-file-uploader"
                  accept="image/*,.pdf"
                  onChange={handleIdUploadFake}
                  className="hidden"
                />
                
                {idUploaded ? (
                  <div className="bg-brand-lime border-2 border-black rounded-none p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-black font-bold font-mono">
                      <ShieldCheck className="w-5 h-5 text-black stroke-[2.5]" />
                      <span>{idFile?.name || "identity_document_secure.png"} (Verified)</span>
                    </div>
                    <span className="text-[9px] text-white bg-black font-mono font-bold uppercase py-0.5 px-2">
                      Ready
                    </span>
                  </div>
                ) : (
                  <label 
                    htmlFor="id-file-uploader" 
                    className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-300 hover:border-black rounded-none p-8 cursor-pointer bg-white transition group"
                  >
                    {idUploading ? (
                      <div className="flex flex-col items-center gap-2 text-xs text-black font-bold font-mono">
                        <Loader2 className="w-8 h-8 text-black animate-spin" />
                        <span>Scanning ID authenticity...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-center space-y-2">
                        <UploadCloud className="w-8 h-8 text-neutral-400 group-hover:text-black transition" />
                        <span className="text-xs text-black font-bold uppercase tracking-wider font-mono">Select ID Card or Passport Photo</span>
                        <span className="text-[10px] text-zinc-500">AES-256 secure storage. Watermark-scanning verified.</span>
                      </div>
                    )}
                  </label>
                )}
              </div>
            </div>

            {/* Profile Avatar Selection mock */}
            <div className="space-y-3">
              <label className="text-[10px] uppercase font-black text-black tracking-widest font-mono block">Choose Hub Preview Avatar</label>
              <div className="grid grid-cols-4 gap-3">
                {PRESET_AVATARS.map((preset, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setPhotoUrl(preset)}
                    className={`relative rounded-none overflow-hidden h-20 border-2 transition-all cursor-pointer ${
                      photoUrl === preset ? 'border-black scale-103 ring-2 ring-brand-lime' : 'border-neutral-200 hover:border-zinc-400'
                    }`}
                  >
                    <img src={preset} alt={`Avatar Preset ${index + 1}`} className="w-full h-full object-cover" />
                    {photoUrl === preset && (
                      <div className="absolute inset-0 bg-brand-lime/20 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-black stroke-[3.0]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Photo Upload options */}
              <div className="relative mt-2">
                <input
                  type="file"
                  id="photo-file-uploader"
                  accept="image/*"
                  onChange={handlePhotoUploadFake}
                  className="hidden"
                />
                <label 
                  htmlFor="photo-file-uploader"
                  className="block text-center py-3 border border-black hover:bg-neutral-50 rounded-none text-[10px] text-black font-black uppercase tracking-wider cursor-pointer transition"
                >
                  {photoUploading ? "Uploading preview image..." : "✦ Or Upload custom professional photo"}
                </label>
              </div>
            </div>

            {/* Legal Consent Form Checkbox */}
            <div className="space-y-2">
              <label className="flex items-start gap-4 border-2 border-black rounded-none p-4 cursor-pointer hover:bg-zinc-50 transition">
                <input
                  type="checkbox"
                  required
                  checked={ageConsent}
                  onChange={(e) => setAgeConsent(e.target.checked)}
                  className="mt-1 accent-black h-4 w-4 rounded-none border-2 border-black"
                />
                <span className="text-xs text-zinc-750 leading-relaxed font-semibold">
                  I solemnly swear under penalty of perjury that <strong className="text-black font-extrabold uppercase font-mono text-[10px]">I am at least 18 years of age</strong>, and that all information entered in this application is 100% accurate and matches my physical government identity paperwork.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Form CTA Buttons */}
        <div className="flex justify-between pt-6 border-t border-zinc-100">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-2 py-3 px-5 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-black transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-black stroke-[2.5]" />
                Back
              </button>
            )}
          </div>

          <div>
            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 py-3.5 px-7 bg-black text-brand-lime font-black uppercase tracking-widest text-[10px] hover:scale-[0.98] transition-all rounded-none cursor-pointer"
              >
                Continue
                <ArrowRight className="w-4 h-4 text-brand-lime stroke-[2.5]" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 py-4 px-8 bg-black text-brand-lime font-black uppercase tracking-widest text-[10px] hover:scale-[0.98] transition-all rounded-none disabled:opacity-50 cursor-pointer animate-pulse"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 text-brand-lime animate-spin" />
                    Submitting Application...
                  </>
                ) : (
                  <>
                    Submit Application Forms
                    <CheckCircle className="w-4 h-4 text-brand-lime stroke-[2.5]" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
