export type Suit = "s" | "h" | "d" | "c";
export interface Card {
  rank: number;
  suit: Suit;
}
export type SourceCategory = "RULE" | "MATH" | "STRATEGY" | "SOLVER";
export type VerificationStatus =
  "VERIFIED" | "THEORY" | "CONTEXT_DEPENDENT" | "UNVERIFIED";
export type PublicationStatus = "draft" | "reviewed" | "published";
export interface SourceReference {
  id: string;
  title: string;
  category: SourceCategory;
  url?: string;
  section?: string;
  accessedAt?: string;
  verificationNotes: string;
  verificationStatus: VerificationStatus;
  caveat: string;
}
export interface PokerTableState {
  hole: Card[];
  board: Card[];
  opponent?: Card[];
  pot?: number;
  dealer?: number;
  seats?: boolean;
  label?: string;
}
export interface QuizQuestion {
  id: string;
  kind: "choice" | "binary" | "hand" | "compare" | "action" | "number";
  prompt: string;
  situation: string;
  options?: string[];
  answer: string;
  explanation: string;
  pitfall: string;
  related: string;
  sourceIds: string[];
  difficulty: "beginner";
  topic: string;
  version: string;
  tableState?: PokerTableState;
  tolerance?: number;
}
export interface LessonStep {
  id: string;
  type: "explanation" | "animation" | "interaction" | "quiz";
  content: string;
  sourceIds: string[];
  tableState?: PokerTableState;
  question?: QuizQuestion;
  interaction?: "select-five" | "deal" | "button" | "chips" | "flip";
}
export interface Lesson {
  id: string;
  version: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedMinutes: number;
  learningObjectives: string[];
  prerequisites: string[];
  steps: LessonStep[];
  sourceIds: string[];
  verificationStatus: VerificationStatus;
  publicationStatus: PublicationStatus;
  updatedAt: string;
  topic: string;
}
export interface AnswerRecord {
  id: string;
  lessonId: string;
  lessonVersion: string;
  questionId: string;
  questionVersion: string;
  answer: string;
  correct: boolean;
  correctAnswer: string;
  topic: string;
  answeredAt: string;
}
export interface LessonProgressRecord {
  step: number;
  completed: boolean;
  updatedAt: string;
  version: string;
}
export interface LearningData {
  schemaVersion: 1;
  answers: AnswerRecord[];
  progress: Record<string, LessonProgressRecord>;
  lastLesson?: string;
  reducedMotion: boolean;
}
