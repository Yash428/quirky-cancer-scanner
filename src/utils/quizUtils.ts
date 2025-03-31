
import { Question, CancerTypeScores } from "../types/quizTypes";

/**
 * Analyzes responses to general questions to determine potential cancer types
 */
export const analyzeGeneralResponses = (
  generalResponses: Record<number, string | number>,
  generalQuestions: Question[]
): { 
  detectedTypes: string[]; 
  hasPositiveResponses: boolean;
} => {
  // Count symptoms for each cancer type
  const cancerTypeScores: CancerTypeScores = {
    "skin": 0,
    "kidney": 0,
    "brain": 0,
    "oral": 0,
    "breast": 0
  };
  
  let hasPositiveResponses = false;
  
  // Analyze responses to determine cancer types
  for (const question of generalQuestions) {
    const response = generalResponses[question.id];
    
    if (response === "Yes") {
      hasPositiveResponses = true;
      
      // Increment scores based on response and question category hints
      if (question.options && question.options.cancer_type_hints) {
        const hints = question.options.cancer_type_hints;
        for (const [cancerType, weight] of Object.entries(hints)) {
          if (cancerTypeScores.hasOwnProperty(cancerType)) {
            cancerTypeScores[cancerType] += Number(weight);
          }
        }
      }
    }
  }
  
  // Find all cancer types with scores above 0
  const detectedTypes = Object.entries(cancerTypeScores)
    .filter(([_, score]) => score > 0)
    .map(([type]) => type);
  
  // Default to "general" if no clear indication
  if (detectedTypes.length === 0) {
    detectedTypes.push("general");
  }
  
  return { detectedTypes, hasPositiveResponses };
};

/**
 * Calculates risk score based on all responses
 */
export const calculateRiskScore = (
  allResponses: Record<number, string | number>,
  questions: Question[]
): number => {
  let totalScore = 0;
  
  // Calculate score based on responses and question weights
  for (const question of questions) {
    const response = allResponses[question.id];
    
    if (!response) continue;
    
    // Different calculation based on question type
    switch (question.question_type) {
      case 'boolean':
        if (response === 'Yes') {
          totalScore += question.weight;
        }
        break;
      case 'range':
        // For range, we normalize the score based on the range
        if (question.options.min !== undefined && question.options.max !== undefined) {
          const range = question.options.max - question.options.min;
          const normalizedValue = (Number(response) - question.options.min) / range;
          totalScore += Math.round(normalizedValue * question.weight);
        }
        break;
      case 'select':
        // For select, we assign different weights based on the selection
        if (question.options.options && question.options.options.length > 0) {
          const options = question.options.options;
          const responseIndex = options.indexOf(response.toString());
          if (responseIndex >= 0) {
            const optionScore = (responseIndex / (options.length - 1)) * question.weight;
            totalScore += Math.round(optionScore);
          }
        }
        break;
    }
  }
  
  return totalScore;
};
