
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/DashboardSidebar";
import QuizComponent from "@/components/QuizComponent";
import QuizResults from "@/components/QuizResults";

// Define proper types for our data structures
interface QuestionOption {
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  cancer_type_hints?: Record<string, number>;
}

interface Question {
  id: number;
  question_text: string;
  question_type: string;
  options: QuestionOption;
  weight: number;
  category?: string;
  next_question_logic?: Record<string, number> | { default: number };
}

interface RiskAssessment {
  id: number;
  risk_level: string;
  advice: string;
  min_score: number;
  max_score: number;
  foods_to_eat: string[];
  foods_to_avoid: string[];
  cancer_type?: string;
}

const Quiz = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [generalQuestions, setGeneralQuestions] = useState<Question[]>([]);
  const [specializedQuestions, setSpecializedQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<number, string | number>>({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [quizPhase, setQuizPhase] = useState("general"); // general or specialized
  const [detectedCancerType, setDetectedCancerType] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch questions from the database
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        console.log("Fetching questions from Supabase...");
        // Fetch general screening questions
        const { data: generalData, error: generalError } = await supabase
          .from("questions")
          .select("*")
          .eq("category", "general")
          .order("id");

        if (generalError) {
          console.error("Error fetching general questions:", generalError);
          throw generalError;
        }
        
        console.log("General questions fetched:", generalData);
        setGeneralQuestions(generalData);

        // Fetch all other questions for the specialized phase
        const { data: specializedData, error: specializedError } = await supabase
          .from("questions")
          .select("*")
          .not("category", "eq", "general")
          .order("id");

        if (specializedError) {
          console.error("Error fetching specialized questions:", specializedError);
          throw specializedError;
        }
        
        console.log("Specialized questions fetched:", specializedData);
        setSpecializedQuestions(specializedData);

        // Initially set the active questions to general screening
        if (generalData && generalData.length > 0) {
          setQuestions(generalData);
          setIsLoading(false);
        } else {
          console.error("No general questions found in the database");
          toast({
            variant: "destructive",
            title: "No Questions Found",
            description: "The quiz database appears to be empty. Please try again later.",
          });
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch quiz questions. Please try again later.",
        });
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  // Handle response saving
  const handleResponse = async (questionId: number, response: string | number) => {
    try {
      // Store response in state
      const newResponses = { ...responses, [questionId]: response };
      setResponses(newResponses);

      // Get the current question
      const currentQuestion = questions[currentQuestionIndex];
      
      // Determine the next question based on the response
      let nextQuestionIndex;
      if (currentQuestion.next_question_logic && 
          typeof response === 'string' && 
          currentQuestion.next_question_logic[response] !== undefined) {
        // Use logic mapping if applicable
        const nextQuestionId = currentQuestion.next_question_logic[response] as number;
        nextQuestionIndex = questions.findIndex(q => q.id === nextQuestionId);
      } else if (currentQuestion.next_question_logic && 
                'default' in currentQuestion.next_question_logic) {
        // Use default if specific mapping not found
        const nextQuestionId = (currentQuestion.next_question_logic as { default: number }).default;
        nextQuestionIndex = questions.findIndex(q => q.id === nextQuestionId);
      } else {
        // Just go to the next question in sequence
        nextQuestionIndex = currentQuestionIndex + 1;
      }

      // If there are more questions in current phase, go to the next one
      if (nextQuestionIndex < questions.length && nextQuestionIndex >= 0) {
        setCurrentQuestionIndex(nextQuestionIndex);
      } else if (quizPhase === "general") {
        // Transition from general to specialized phase
        await analyzeGeneralResponses(newResponses);
      } else {
        // Quiz is completed, save all responses to the database
        await saveAllResponses(newResponses);
        calculateRiskScore(newResponses);
        setQuizCompleted(true);
      }

    } catch (error) {
      console.error("Error handling response:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process your response. Please try again.",
      });
    }
  };

  // Analyze general phase responses to determine cancer type for specialized phase
  const analyzeGeneralResponses = async (generalResponses: Record<number, string | number>) => {
    // This is a simplified algorithm to determine the most likely cancer type
    // In a real application, this would be more sophisticated

    // Count symptoms for each cancer type
    const cancerTypeScores: Record<string, number> = {
      "skin": 0,
      "kidney": 0,
      "brain": 0,
      "oral": 0,
      "breast": 0
    };
    
    // Analyze responses to determine the most likely cancer type
    for (const question of generalQuestions) {
      const response = generalResponses[question.id];
      
      if (!response || response === "No") continue;
      
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
    
    // Find the cancer type with the highest score
    let maxScore = 0;
    let detectedType: string | null = null;
    
    for (const [type, score] of Object.entries(cancerTypeScores)) {
      if (score > maxScore) {
        maxScore = score;
        detectedType = type;
      }
    }
    
    // Default to "general" if no clear indication
    if (maxScore === 0) {
      detectedType = "general";
    }
    
    setDetectedCancerType(detectedType);
    
    // Filter questions for the detected cancer type
    const specializedQuestionsForType = specializedQuestions.filter(
      q => q.category === detectedType
    );
    
    if (specializedQuestionsForType.length > 0) {
      setQuestions(specializedQuestionsForType);
      setCurrentQuestionIndex(0);
      setQuizPhase("specialized");
      
      toast({
        title: "Phase Complete",
        description: `Based on your responses, we'll now ask specific questions about ${detectedType} cancer symptoms.`,
      });
    } else {
      // If no specialized questions found, complete the quiz
      await saveAllResponses(generalResponses);
      calculateRiskScore(generalResponses);
      setQuizCompleted(true);
    }
  };

  // Save all responses to the database
  const saveAllResponses = async (allResponses: Record<number, string | number>) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "You need to be logged in to save quiz results.",
      });
      navigate("/login");
      return;
    }

    try {
      // Loop through responses and save each one
      for (const [questionId, response] of Object.entries(allResponses)) {
        const { error } = await supabase
          .from("user_responses")
          .insert({
            user_id: user.id,
            question_id: parseInt(questionId),
            response: response.toString()
          });

        if (error) throw error;
      }
      
      toast({
        title: "Success",
        description: "Your quiz responses have been saved successfully!",
      });
      
    } catch (error) {
      console.error("Error saving responses:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save your responses. Please try again later.",
      });
    }
  };

  // Calculate risk score based on responses
  const calculateRiskScore = async (allResponses: Record<number, string | number>) => {
    let totalScore = 0;
    let maxPossibleScore = 0;
    
    // Calculate score based on responses and question weights
    const currentQuestionsSet = quizPhase === "specialized" 
      ? [...generalQuestions, ...questions]
      : questions;
      
    for (const question of currentQuestionsSet) {
      const response = allResponses[question.id];
      maxPossibleScore += question.weight;
      
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
    
    setScore(totalScore);
    
    // Fetch the appropriate risk assessment based on the score and cancer type
    try {
      let query = supabase
        .from("risk_assessments")
        .select("*")
        .lte("min_score", totalScore)
        .gte("max_score", totalScore);
        
      // If we have a detected cancer type, filter by it
      if (detectedCancerType && detectedCancerType !== "general") {
        query = query.eq("cancer_type", detectedCancerType);
      }
        
      const { data, error } = await query.single();
        
      if (error) throw error;
      setRiskAssessment(data);
      
    } catch (error) {
      console.error("Error fetching risk assessment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to determine your risk assessment. Please try again later.",
      });
    }
  };

  // Reset the quiz
  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setResponses({});
    setQuizCompleted(false);
    setScore(0);
    setRiskAssessment(null);
    setQuizPhase("general");
    setDetectedCancerType(null);
    setQuestions(generalQuestions);
  };

  // Page transition variants
  const pageVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { duration: 0.5, when: "beforeChildren", staggerChildren: 0.2 }
    },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  };

  const itemVariants = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { duration: 0.5 } },
    exit: { y: -20, opacity: 0, transition: { duration: 0.3 } }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-50 to-blue-50 overflow-hidden">
      <DashboardSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-6">
          <motion.div 
            className="flex flex-col gap-8 max-w-6xl mx-auto"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <motion.div variants={itemVariants}>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border-2 border-purple-100 shadow-lg p-6">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                  <span className="text-gradient bg-gradient-to-r from-cancer-blue to-cancer-purple bg-clip-text text-transparent">
                    Cancer Risk Assessment Quiz
                  </span>
                </h1>
                <p className="text-gray-600">
                  {quizPhase === "general" 
                    ? "Answer a few general screening questions to help us assess your cancer risk factors." 
                    : `We're now focusing on specific symptoms related to ${detectedCancerType} cancer to provide personalized recommendations.`}
                </p>
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Disclaimer:</strong> This quiz is for informational purposes only and not a substitute for professional medical advice. 
                    Please consult with a healthcare professional for proper diagnosis and treatment.
                  </p>
                </div>
              </div>
            </motion.div>
            
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div 
                  key="loading"
                  variants={itemVariants}
                  className="bg-white/80 backdrop-blur-sm rounded-xl border-2 border-purple-100 shadow-lg p-8 flex flex-col justify-center items-center h-64"
                >
                  <motion.div
                    animate={{ 
                      rotate: 360,
                      transition: { duration: 2, repeat: Infinity, ease: "linear" }
                    }}
                    className="mb-4"
                  >
                    <div className="w-12 h-12 border-4 border-cancer-blue border-t-transparent rounded-full"></div>
                  </motion.div>
                  <p className="text-center text-gray-600">Loading your personalized quiz...</p>
                </motion.div>
              ) : quizCompleted ? (
                <motion.div
                  key="results"
                  variants={itemVariants}
                >
                  <QuizResults 
                    score={score} 
                    riskAssessment={riskAssessment}
                    cancerType={detectedCancerType}
                    resetQuiz={resetQuiz} 
                  />
                </motion.div>
              ) : questions.length > 0 ? (
                <motion.div
                  key={`question-${currentQuestionIndex}-${quizPhase}`}
                  variants={itemVariants}
                >
                  <QuizComponent 
                    question={questions[currentQuestionIndex]} 
                    onResponse={handleResponse}
                    currentQuestion={currentQuestionIndex + 1}
                    totalQuestions={questions.length}
                    quizPhase={quizPhase}
                    phaseProgress={quizPhase === "general" 
                      ? `General Screening (${currentQuestionIndex + 1}/${generalQuestions.length})` 
                      : `${detectedCancerType?.charAt(0).toUpperCase() + detectedCancerType?.slice(1)} Cancer Assessment`}
                  />
                </motion.div>
              ) : (
                <motion.div 
                  key="no-questions"
                  variants={itemVariants}
                  className="bg-white/80 backdrop-blur-sm rounded-xl border-2 border-purple-100 shadow-lg p-6"
                >
                  <p className="text-center text-gray-600">No questions available. Please try again later.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
