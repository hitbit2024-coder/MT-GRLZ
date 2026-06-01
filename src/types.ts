export interface Applicant {
  id: string;
  fullName: string;
  displayName: string;
  email: string;
  age: number;
  location: string;
  primaryCategory: string;
  languages?: string;
  internetSpeed?: string;
  experience?: string;
  introduction?: string;
  photoUrl?: string;
  status: 'new' | 'reviewing' | 'contacted' | 'accepted' | 'declined';
  notes?: string;
  score?: number;
  createdAt: any; // Firestore Timestamp or string
  updatedAt?: any;
}

export type ApplicationStatus = 'new' | 'reviewing' | 'contacted' | 'accepted' | 'declined';

export interface EarningsCalculationResult {
  tokensPerHour: number;
  hoursPerWeek: number;
  tokenValue: number; // conversion slider, e.g. $0.05
  weeklyTokens: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  annualEarnings: number;
  agencySplitSelect: number; // rate e.g. 100% (direct payout equivalent or agency bonus matching)
}
