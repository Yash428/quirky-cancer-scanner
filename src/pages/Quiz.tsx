
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/DashboardSidebar";
import QuizComponent from "@/components/QuizComponent";
import QuizResults from "@/components/QuizResults";
import HealthyResult from "@/components/HealthyResult";
import { analyzeGeneralResponses, calculateRiskScore } from "@/utils/quizUtils";
import { Question, RiskAssessment, QuizState, CancerTypeRiskAssessment } from "@/types/quizTypes";

const Quiz = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  
  // Quiz state
  const [state, setState] = useState<QuizState>({
    isLoading: true,
    questions: [],
    generalQuestions: [],
    specializedQuestions: [],
    currentQuestionIndex: 0,
    responses: {},
    quizCompleted: false,
    score: 0,
    riskAssessment: null,
    quizPhase: "general",
    detectedCancerTypes: [],
    currentCancerType: null,
    allCancerTypesProcessed: false,
    cancerTypesQueue: [],
    hasPositiveResponses: false,
    cancerTypeRiskAssessments: []
  });

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

        // Initially set the active questions to general screening
        if (generalData && generalData.length > 0) {
          const parsedGeneralQuestions = generalData.map((q: any) => ({
            ...q,
            options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
            next_question_logic: typeof q.next_question_logic === 'string' ? 
              JSON.parse(q.next_question_logic) : q.next_question_logic
          }));
          
          const parsedSpecializedQuestions = specializedData.map((q: any) => ({
            ...q,
            options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
            next_question_logic: typeof q.next_question_logic === 'string' ? 
              JSON.parse(q.next_question_logic) : q.next_question_logic
          }));
          
          setState(prev => ({
            ...prev,
            generalQuestions: parsedGeneralQuestions,
            specializedQuestions: parsedSpecializedQuestions,
            questions: parsedGeneralQuestions,
            isLoading: false
          }));
        } else {
          console.error("No general questions found in the database");
          toast({
            variant: "destructive",
            title: "No Questions Found",
            description: "The quiz database appears to be empty. Please try again later.",
          });
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch quiz questions. Please try again later.",
        });
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchQuestions();
  }, []);

  // Handle response saving
  const handleResponse = async (questionId: number, response: string | number) => {
    try {
      // Store response in state
      const newResponses = { ...state.responses, [questionId]: response };
      
      setState(prev => ({
        ...prev,
        responses: newResponses
      }));

      // Get the current question
      const currentQuestion = state.questions[state.currentQuestionIndex];
      
      // Determine the next question based on the response
      let nextQuestionIndex;
      if (currentQuestion.next_question_logic && 
          typeof response === 'string' && 
          currentQuestion.next_question_logic[response] !== undefined) {
        // Use logic mapping if applicable
        const nextQuestionId = currentQuestion.next_question_logic[response] as number;
        nextQuestionIndex = state.questions.findIndex(q => q.id === nextQuestionId);
      } else if (currentQuestion.next_question_logic && 
                'default' in currentQuestion.next_question_logic) {
        // Use default if specific mapping not found
        const nextQuestionId = (currentQuestion.next_question_logic as { default: number }).default;
        nextQuestionIndex = state.questions.findIndex(q => q.id === nextQuestionId);
      } else {
        // Just go to the next question in sequence
        nextQuestionIndex = state.currentQuestionIndex + 1;
      }

      // If there are more questions in current phase, go to the next one
      if (nextQuestionIndex < state.questions.length && nextQuestionIndex >= 0) {
        setState(prev => ({
          ...prev,
          currentQuestionIndex: nextQuestionIndex
        }));
      } else if (state.quizPhase === "general") {
        // Transition from general to specialized phase - process all detected cancer types
        await processGeneralPhaseCompletion(newResponses);
      } else if (state.cancerTypesQueue.length > 0) {
        // Move to the next cancer type in the queue
        await loadNextCancerType();
      } else {
        // Quiz is completed, save all responses to the database
        await saveAllResponses(newResponses);
        
        // Calculate risk assessments for all detected cancer types
        const riskAssessments = await calculateAllRiskAssessments(state.detectedCancerTypes, newResponses);
        
        setState(prev => ({
          ...prev,
          quizCompleted: true,
          allCancerTypesProcessed: true,
          cancerTypeRiskAssessments: riskAssessments
        }));
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

  // Calculate risk assessments for all detected cancer types
  const calculateAllRiskAssessments = async (
    detectedTypes: string[],
    responses: Record<number, string | number>
  ): Promise<CancerTypeRiskAssessment[]> => {
    const assessments: CancerTypeRiskAssessment[] = [];
    
    // Process each cancer type
    for (const cancerType of detectedTypes) {
      try {
        // Get relevant questions for this cancer type
        const relevantQuestions = [
          ...state.generalQuestions,
          ...state.specializedQuestions.filter(q => q.category === cancerType)
        ];
        
        // Calculate score for this cancer type
        const score = calculateRiskScore(responses, relevantQuestions);
        
        // Fetch risk assessment for this cancer type and score
        const riskAssessment = await fetchRiskAssessmentForType(score, cancerType);
        
        assessments.push({
          cancerType,
          score,
          riskAssessment
        });
      } catch (error) {
        console.error(`Error calculating risk for ${cancerType}:`, error);
      }
    }
    
    // Set the primary risk assessment (for backward compatibility)
    if (assessments.length > 0) {
      setState(prev => ({
        ...prev,
        riskAssessment: assessments[0].riskAssessment,
        score: assessments[0].score
      }));
    }
    
    return assessments;
  };

  // Fetch risk assessment for a specific cancer type
  const fetchRiskAssessmentForType = async (score: number, cancerType: string): Promise<RiskAssessment | null> => {
    try {
      let query = supabase
        .from("risk_assessments")
        .select("*")
        .lte("min_score", score)
        .gte("max_score", score);
      
      // Filter by cancer type if it's not general
      if (cancerType !== "general") {
        query = query.eq("cancer_type", cancerType);
      }
      
      const { data, error } = await query.single();
      
      if (error) {
        // If no specific risk assessment for this cancer type, try generic one
        const { data: genericData, error: genericError } = await supabase
          .from("risk_assessments")
          .select("*")
          .lte("min_score", score)
          .gte("max_score", score)
          .is("cancer_type", null)
          .single();
          
        if (genericError) throw genericError;
        return genericData;
      }
      
      return data;
    } catch (error) {
      console.error(`Error fetching risk assessment for ${cancerType}:`, error);
      return null;
    }
  };

  // Process completion of the general phase
  const processGeneralPhaseCompletion = async (responses: Record<number, string | number>) => {
    const { detectedTypes, hasPositiveResponses } = analyzeGeneralResponses(
      responses, 
      state.generalQuestions
    );
    
    if (!hasPositiveResponses) {
      // If no positive responses, complete the quiz with "healthy" result
      await saveAllResponses(responses);
      setState(prev => ({
        ...prev,
        quizCompleted: true,
        hasPositiveResponses: false,
        allCancerTypesProcessed: true
      }));
      return;
    }

    // Remove "general" if there are specific types detected
    const specificTypes = detectedTypes.filter(t => t !== "general");
    const typesToProcess = specificTypes.length > 0 ? specificTypes : detectedTypes;
    
    if (typesToProcess.length > 0) {
      setState(prev => ({
        ...prev,
        detectedCancerTypes: typesToProcess,
        cancerTypesQueue: typesToProcess.slice(1),  // Queue remaining types
        currentCancerType: typesToProcess[0],       // Start with first type
        hasPositiveResponses: true
      }));
      
      // Load questions for the first detected cancer type
      loadQuestionsForCancerType(typesToProcess[0]);
      
      toast({
        title: "Phase Complete",
        description: typesToProcess.length > 1 
          ? `Based on your responses, we'll ask questions about multiple potential concerns, starting with ${typesToProcess[0]} cancer symptoms.`
          : `Based on your responses, we'll now ask specific questions about ${typesToProcess[0]} cancer symptoms.`,
      });
    } else {
      // If no specialized questions needed, complete the quiz
      await saveAllResponses(responses);
      const assessments = await calculateAllRiskAssessments(["general"], responses);
      
      setState(prev => ({
        ...prev,
        quizCompleted: true,
        allCancerTypesProcessed: true,
        hasPositiveResponses: true,
        cancerTypeRiskAssessments: assessments
      }));
    }
  };

  // Load questions for a specific cancer type
  const loadQuestionsForCancerType = (cancerType: string) => {
    const specializedQuestionsForType = state.specializedQuestions.filter(
      q => q.category === cancerType
    );
    
    if (specializedQuestionsForType.length > 0) {
      setState(prev => ({
        ...prev,
        questions: specializedQuestionsForType,
        currentQuestionIndex: 0,
        quizPhase: "specialized"
      }));
    } else {
      // If no specialized questions found for this type, move to the next type
      loadNextCancerType();
    }
  };

  // Move to the next cancer type in the queue
  const loadNextCancerType = async () => {
    if (state.cancerTypesQueue.length > 0) {
      const nextType = state.cancerTypesQueue[0];
      const remainingQueue = state.cancerTypesQueue.slice(1);
      
      setState(prev => ({
        ...prev,
        currentCancerType: nextType,
        cancerTypesQueue: remainingQueue
      }));
      
      loadQuestionsForCancerType(nextType);
      
      toast({
        title: "Moving to Next Section",
        description: `Now we'll assess your ${nextType} cancer risk factors.`,
      });
    } else {
      // No more cancer types to process
      await saveAllResponses(state.responses);
      
      // Calculate risk assessments for all detected cancer types
      const riskAssessments = await calculateAllRiskAssessments(
        state.detectedCancerTypes, 
        state.responses
      );
      
      setState(prev => ({
        ...prev,
        quizCompleted: true,
        allCancerTypesProcessed: true,
        cancerTypeRiskAssessments: riskAssessments
      }));
    }
  };

  // Fetch risk assessment based on score
  const fetchRiskAssessment = async (score: number) => {
    try {
      let query = supabase
        .from("risk_assessments")
        .select("*")
        .lte("min_score", score)
        .gte("max_score", score);
        
      // If we have a primary detected cancer type, filter by it
      const primaryCancerType = state.detectedCancerTypes[0];
      if (primaryCancerType && primaryCancerType !== "general") {
        query = query.eq("cancer_type", primaryCancerType);
      }
        
      const { data, error } = await query.single();
        
      if (error) throw error;
      
      setState(prev => ({
        ...prev,
        riskAssessment: data,
        score: score
      }));
      
    } catch (error) {
      console.error("Error fetching risk assessment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to determine your risk assessment. Please try again later.",
      });
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

  // Reset the quiz
  const resetQuiz = () => {
    setState({
      ...state,
      currentQuestionIndex: 0,
      responses: {},
      quizCompleted: false,
      score: 0,
      riskAssessment: null,
      quizPhase: "general",
      detectedCancerTypes: [],
      currentCancerType: null,
      allCancerTypesProcessed: false,
      cancerTypesQueue: [],
      hasPositiveResponses: true,
      questions: state.generalQuestions,
      cancerTypeRiskAssessments: []
    });
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
                  {state.quizPhase === "general" 
                    ? "Answer a few general screening questions to help us assess your cancer risk factors." 
                    : `We're now focusing on specific symptoms related to ${state.currentCancerType} cancer to provide personalized recommendations.`}
                </p>
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Disclaimer:</strong> This quiz is for informational purposes only and not a substitute for professional medical advice. 
                    Please consult with a healthcare professional for proper diagnosis and treatment.
                  </p>
                </div>
              </div>
            </motion.div>
            
            <AnimatePresence>
              {state.isLoading ? (
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
              ) : state.quizCompleted ? (
                state.hasPositiveResponses ? (
                  <motion.div
                    key="results"
                    variants={itemVariants}
                  >
                    <QuizResults 
                      score={state.score} 
                      riskAssessment={state.riskAssessment}
                      cancerType={state.detectedCancerTypes[0]}
                      resetQuiz={resetQuiz}
                      allRiskAssessments={state.cancerTypeRiskAssessments}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="healthy-results"
                    variants={itemVariants}
                  >
                    <HealthyResult resetQuiz={resetQuiz} />
                  </motion.div>
                )
              ) : state.questions.length > 0 ? (
                <motion.div
                  key={`question-${state.currentQuestionIndex}-${state.quizPhase}-${state.currentCancerType}`}
                  variants={itemVariants}
                >
                  <QuizComponent 
                    question={state.questions[state.currentQuestionIndex]} 
                    onResponse={handleResponse}
                    currentQuestion={state.currentQuestionIndex + 1}
                    totalQuestions={state.questions.length}
                    quizPhase={state.quizPhase}
                    phaseProgress={state.quizPhase === "general" 
                      ? `General Screening (${state.currentQuestionIndex + 1}/${state.generalQuestions.length})` 
                      : `${state.currentCancerType?.charAt(0).toUpperCase() + state.currentCancerType?.slice(1)} Cancer Assessment (${state.currentQuestionIndex + 1}/${state.questions.length})`}
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
