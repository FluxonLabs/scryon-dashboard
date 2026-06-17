// ─── Calls ───────────────────────────────────────────────────────────────────

export type CallStatus = "QUEUED" | "TRANSCRIBING" | "ANALYZING" | "COMPLETED" | "FAILED";
export type CallDirection = "INCOMING" | "OUTGOING";
export type SpeakerRole = "USER" | "CONTACT" | "UNKNOWN";

export interface CallSummary {
  callId: string;
  title: string | null;
  contactName: string | null;
  organization: string | null;
  direction: CallDirection | null;
  status: CallStatus;
  durationSeconds: number | null;
  recordedAt: string | null;
  createdAt: string;
}

export interface CallDetail extends CallSummary {
  phoneNumber: string | null;
  errorReason: string | null;
}

export interface CallsPage {
  items: CallSummary[];
  nextCursor: string | null;
}

// ─── Transcript ───────────────────────────────────────────────────────────────

export interface TranscriptSpeaker {
  speakerId: string;
  label: string;
  displayName: string;
  role: SpeakerRole;
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

export interface TranscriptSegment {
  id: string;
  speakerId: string;
  speakerLabel: string;
  speakerDisplayName: string;
  role: SpeakerRole;
  startSeconds: number;
  endSeconds: number;
  text: string;
}

export interface Transcript {
  callId: string;
  language: string;
  durationSeconds: number;
  speakers: TranscriptSpeaker[];
  segments: TranscriptSegment[];
}

// ─── Analysis ────────────────────────────────────────────────────────────────

export interface SummaryBullet {
  text: string;
  category: string;
  importance: "low" | "medium" | "high";
  sourceSegmentIds: string[];
}

export interface DiscussionPoint {
  text: string;
  topic: string;
  phase: "opening" | "middle" | "closing" | "followup";
  speakerLabel?: string;
  speakerRole?: SpeakerRole;
  importance: "low" | "medium" | "high";
}

export interface SpeakerSentiment {
  overall: string;
  score: number | null;
  notes: string;
}

export interface SentimentMoment {
  phase: string;
  overall: string;
  note: string;
}

export interface Sentiment {
  overall: string;
  score: number | null;
  reason: string;
  userSentiment?: SpeakerSentiment;
  contactSentiment?: SpeakerSentiment;
  progression?: SentimentMoment[];
  emotionalSignals?: string[];
}

export interface Tone {
  overall: string;
  descriptors: string[];
  formality: string;
  energy: string;
  pace: string;
  notes: string;
}

export interface AnalysisActionItem {
  title: string;
  description: string;
  ownerDisplayName: string | null;
  ownerRole: SpeakerRole;
  dueDate: string | null;
  priority: "low" | "medium" | "high";
  intent: string | null;
}

export interface Analysis {
  callType: string;
  suggestedTitle: string;
  oneLineSummary: string;
  executiveSummary: string;
  executiveSummaryBullets: SummaryBullet[];
  conversationOutcome: string;
  keyDiscussionPoints: DiscussionPoint[];
  actionItems: AnalysisActionItem[];
  sentiment: Sentiment;
  tone: Tone;
  tags: string[];
  qualityWarnings: string[];
}

// ─── Action Items ─────────────────────────────────────────────────────────────

export interface ActionItem {
  id: string;
  callRecordId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: "PENDING" | "COMPLETED";
  ownerDisplayName: string | null;
  ownerRole: SpeakerRole;
  intent: string | null;
  createdAt: string;
}
