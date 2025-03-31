
export interface QuestionOption {
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  cancer_type_hints?: Record<string, number>;
}

export interface Question {
  id: number;
  question_text: string;
  question_type: string;
  options: QuestionOption;
  weight: number;
  category?: string;
  next_question_logic?: Record<string, number> | { default: number };
}

export interface RiskAssessment {
  id: number;
  risk_level: string;
  advice: string;
  min_score: number;
  max_score: number;
  foods_to_eat: string[];
  foods_to_avoid: string[];
  cancer_type?: string;
  precautions?: string[];
}

export interface CancerTypeScores {
  [key: string]: number;
}

export interface CancerTypeRiskAssessment {
  cancerType: string;
  score: number;
  riskAssessment: RiskAssessment | null;
}

export interface QuizState {
  isLoading: boolean;
  questions: Question[];
  generalQuestions: Question[];
  specializedQuestions: Question[];
  currentQuestionIndex: number;
  responses: Record<number, string | number>;
  quizCompleted: boolean;
  score: number;
  riskAssessment: RiskAssessment | null;
  quizPhase: string;
  detectedCancerTypes: string[];
  currentCancerType: string | null;
  allCancerTypesProcessed: boolean;
  cancerTypesQueue: string[];
  hasPositiveResponses: boolean;
  cancerTypeRiskAssessments: CancerTypeRiskAssessment[];
}
