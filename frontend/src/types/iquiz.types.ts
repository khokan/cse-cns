export type QuizDifficulty = "easy" | "medium" | "hard";

export type QuizQuestionType = "mcq" | "truefalse";

export interface QuizQuestion {
  type: QuizQuestionType;
  question: string;
  options?: string[];
  answer: string;
}

export interface GeneratedQuizSession {
  quizSessionId: string;
  topic: string;
  difficulty: QuizDifficulty;
  gradeLevel: string;
  numberOfQuestions: number;
  questions: QuizQuestion[];
}

export interface QuizHistoryEntry {
  id: string;
  quizSessionId: string;
  topic: string;
  difficulty: QuizDifficulty;
  gradeLevel: string;
  numberOfQuestions: number;
  score: number;
  percentage: number;
  timeTakenSeconds: number;
  completedAt: string;
}