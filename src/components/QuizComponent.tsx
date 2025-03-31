
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, ArrowRight, BrainCircuit, Activity } from "lucide-react";

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
}

interface QuizComponentProps {
  question: Question;
  onResponse: (questionId: number, response: string | number) => void;
  currentQuestion: number;
  totalQuestions: number;
  quizPhase: string;
  phaseProgress: string;
}

const QuizComponent = ({ 
  question, 
  onResponse, 
  currentQuestion, 
  totalQuestions,
  quizPhase,
  phaseProgress
}: QuizComponentProps) => {
  const [response, setResponse] = useState<string | null>(null);
  const [sliderValue, setSliderValue] = useState<number[]>([1]);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Reset response when question changes
  useEffect(() => {
    setResponse(null);
    setIsValid(false);
    setIsSubmitting(false);
    
    // Set default slider value
    if (question.question_type === 'range' && question.options) {
      setSliderValue([question.options.min || 1]);
    }
  }, [question]);

  // Validate response
  useEffect(() => {
    if (question.question_type === 'boolean' || question.question_type === 'select') {
      setIsValid(response !== null);
    } else if (question.question_type === 'range') {
      setIsValid(true); // Range always has a value
    }
  }, [response, question.question_type]);

  // Auto submit on valid selection for boolean and select types
  useEffect(() => {
    if (isValid && (question.question_type === 'boolean' || question.question_type === 'select') && response !== null) {
      const timer = setTimeout(() => {
        handleSubmit();
      }, 600); // Delay to show selection animation
      
      return () => clearTimeout(timer);
    }
  }, [response, isValid, question.question_type]);

  // Handle submit
  const handleSubmit = () => {
    if (isValid && !isSubmitting) {
      setIsSubmitting(true);
      
      setTimeout(() => {
        if (question.question_type === 'range') {
          onResponse(question.id, sliderValue[0]);
        } else if (response !== null) {
          onResponse(question.id, response);
        }
      }, 300); // Small delay for animation completion
    }
  };

  // Bubble animation variants
  const bubbleVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { duration: 0.5 } },
    exit: { scale: 0.8, opacity: 0, transition: { duration: 0.3 } },
    hover: { scale: 1.05, boxShadow: "0 0 15px rgba(139, 92, 246, 0.5)" },
    selected: { 
      scale: 1.05, 
      boxShadow: "0 0 15px rgba(139, 92, 246, 0.5)",
      backgroundColor: "rgb(139, 92, 246)",
      color: "white",
      transition: { duration: 0.3 }
    }
  };

  // Progress indicator animation
  const progressVariants = {
    initial: { width: 0 },
    animate: { 
      width: `${(currentQuestion / totalQuestions) * 100}%`,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  // Phase icon
  const PhaseIcon = () => {
    if (quizPhase === "general") {
      return <Activity className="w-5 h-5 text-blue-500" />;
    } else {
      return <BrainCircuit className="w-5 h-5 text-purple-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-white to-purple-50 rounded-xl border border-purple-200 shadow-lg p-8 relative overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-200 rounded-full opacity-20"></div>
      <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-blue-200 rounded-full opacity-20"></div>
      
      <div className="mb-8 relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <PhaseIcon />
          <p className="text-sm font-medium text-purple-600">
            {phaseProgress}
          </p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
          <motion.div 
            className="bg-gradient-to-r from-cancer-blue to-cancer-purple h-3 rounded-full" 
            variants={progressVariants}
            initial="initial"
            animate="animate"
          ></motion.div>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium text-purple-600">
            Question {currentQuestion} of {totalQuestions}
          </p>
          <p className="text-sm font-medium text-purple-600">
            {Math.round((currentQuestion / totalQuestions) * 100)}% complete
          </p>
        </div>
      </div>

      <AnimatePresence>
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold mb-6 text-gradient bg-gradient-to-r from-cancer-blue to-cancer-purple bg-clip-text text-transparent">
            {question.question_text}
          </h2>

          {question.question_type === 'boolean' && question.options?.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {question.options.options.map((option) => (
                <motion.button
                  key={option}
                  initial="initial"
                  animate={response === option ? "selected" : "animate"}
                  exit="exit"
                  whileHover={response !== option ? "hover" : ""}
                  variants={bubbleVariants}
                  className={`relative p-6 rounded-2xl border-2 transition-all duration-300 flex items-center justify-center
                    ${response === option 
                      ? 'border-cancer-purple bg-cancer-purple text-white' 
                      : 'border-purple-200 bg-white hover:border-cancer-purple'}`}
                  onClick={() => setResponse(option)}
                >
                  <span className="text-lg font-semibold">{option}</span>
                  {response === option && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-4"
                    >
                      <Check className="w-5 h-5" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          )}

          {question.question_type === 'range' && (
            <div className="px-4 py-8 bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-purple-100">
              <Slider
                value={sliderValue}
                min={question.options?.min || 1}
                max={question.options?.max || 10}
                step={question.options?.step || 1}
                onValueChange={setSliderValue}
                className="my-6"
              />
              <div className="flex justify-between mt-2">
                <span className="text-sm text-gray-500 font-medium">
                  {question.options?.min || 1}
                </span>
                <motion.div 
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  key={sliderValue[0]} 
                  className="text-2xl font-bold text-cancer-purple"
                >
                  {sliderValue[0]}
                </motion.div>
                <span className="text-sm text-gray-500 font-medium">
                  {question.options?.max || 10}
                </span>
              </div>
              
              <div className="flex justify-end mt-6">
                <Button
                  onClick={handleSubmit}
                  className="bg-gradient-to-r from-cancer-blue to-cancer-purple hover:from-cancer-purple hover:to-cancer-blue text-white transition-all duration-300 transform hover:scale-105 group"
                >
                  Next Question
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          )}

          {question.question_type === 'select' && question.options?.options && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-purple-100 p-6">
              <Select onValueChange={(value) => setResponse(value)}>
                <SelectTrigger className="w-full text-base border-2 border-purple-100 hover:border-cancer-purple transition-colors">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-sm border border-purple-100">
                  {question.options.options.map((option) => (
                    <SelectItem 
                      key={option} 
                      value={option}
                      className="focus:bg-purple-50 focus:text-cancer-purple"
                    >
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default QuizComponent;
