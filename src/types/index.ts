// ─── Contacts ────────────────────────────────────────────────────────────────

export interface Contact {
  id: string;
  name: string;
  phoneNumber: string | null;
  email: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

// ─── Calls ───────────────────────────────────────────────────────────────────

export type CallStatus = "QUEUED" | "TRANSCRIBING" | "ANALYZING" | "COMPLETED" | "FAILED";
export type CallDirection = "INCOMING" | "OUTGOING";
export type SpeakerRole = "USER" | "CONTACT" | "UNKNOWN";

export interface CallSummary {
  id: string;
  title: string | null;
  originalFileName: string | null;
  status: CallStatus;
  durationSeconds: number | null;
  createdAt: string;
  shortSummary: string | null;
  tags: string[] | null;
  scryonContactId?: string | null;
}

export interface CallDetail {
  id: string;
  title: string | null;
  originalFileName: string | null;
  contactName: string | null;
  phoneNumber: string | null;
  durationSeconds: number | null;
  recordedAt: string | null;
  status: CallStatus;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string | null;
  direction: CallDirection | null;
  contactId: string | null;
  organization: string | null;
  scryonContactId?: string | null;
  shortSummary?: string | null;
  notes?: string | null;
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
  header: string;
  startTimestamp: string | null;
  paragraphs: string[];
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

export interface PartyTone {
  overall?: string;
  descriptors?: string[];
  notes?: string;
}

export interface Tone {
  overall: string;
  descriptors: string[];
  formality: string;
  energy: string;
  pace: string;
  notes: string;
  byParty?: {
    userTone?: PartyTone;
    contactTone?: PartyTone;
  } | null;
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

export type ActionItemStatus = "OPEN" | "IN_PROGRESS" | "DONE" | "DISMISSED";
export type ActionItemPriority = "LOW" | "MEDIUM" | "HIGH";

export interface ActionItem {
  id: string;
  callRecordId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: ActionItemStatus;
  ownerDisplayName: string | null;
  ownerRole: SpeakerRole;
  intent: string | null;
  createdAt: string;
  updatedAt: string | null;
  priority: ActionItemPriority | null;
  source: "AI" | "MANUAL" | null;
  contactId: string | null;
}

export interface ActionItemInput {
  title: string;
  description?: string | null;
  dueDate?: string | null;
  priority?: ActionItemPriority | null;
  status?: ActionItemStatus;
}
