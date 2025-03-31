
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Check,
  X,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  BookOpen,
  Utensils,
  Calendar,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useState } from "react";
import { 
  RiskAssessment, 
  CancerTypeRiskAssessment 
} from "@/types/quizTypes";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface QuizResultsProps {
  score: number;
  riskAssessment: RiskAssessment | null;
  cancerType: string | null;
  resetQuiz: () => void;
  allRiskAssessments?: CancerTypeRiskAssessment[];
}

const QuizResults = ({ 
  score, 
  riskAssessment, 
  cancerType, 
  resetQuiz,
  allRiskAssessments = []
}: QuizResultsProps) => {
  const [showAllFoods, setShowAllFoods] = useState<boolean>(false);
  const [showAllPrecautions, setShowAllPrecautions] = useState<boolean>(false);
  const [selectedAssessmentIndex, setSelectedAssessmentIndex] = useState<number>(0);

  // Check if we have multiple assessments
  const hasMultipleAssessments = allRiskAssessments.length > 1;
  
  // If we have multiple assessments but no valid selection, pick the first one
  const currentAssessment = hasMultipleAssessments 
    ? allRiskAssessments[selectedAssessmentIndex] 
    : { cancerType: cancerType || "general", score, riskAssessment };

  if (!riskAssessment && (!currentAssessment || !currentAssessment.riskAssessment)) {
    return (
      <div className="bg-white rounded-xl border border-cancer-blue/10 shadow-sm p-6 flex flex-col items-center justify-center min-h-[400px]">
        <motion.div
          animate={{ 
            rotate: 360,
            transition: { duration: 2, repeat: Infinity, ease: "linear" }
          }}
        >
          <div className="w-16 h-16 border-4 border-cancer-blue border-t-transparent rounded-full"></div>
        </motion.div>
        <p className="text-center text-gray-600 mt-4">
          Processing your results... Please wait.
        </p>
      </div>
    );
  }

  const getRiskLevelInfo = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'low':
        return {
          color: 'bg-green-100 text-green-700',
          icon: <ShieldCheck className="w-8 h-8 text-green-700" />,
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
          shadowColor: 'shadow-green-100'
        };
      case 'moderate':
      case 'medium':
        return {
          color: 'bg-yellow-100 text-yellow-700',
          icon: <AlertTriangle className="w-8 h-8 text-yellow-700" />,
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200',
          shadowColor: 'shadow-yellow-100'
        };
      case 'high':
        return {
          color: 'bg-red-100 text-red-700',
          icon: <AlertCircle className="w-8 h-8 text-red-700" />,
          textColor: 'text-red-700',
          borderColor: 'border-red-200',
          shadowColor: 'shadow-red-100'
        };
      default:
        return {
          color: 'bg-blue-100 text-blue-700',
          icon: <AlertCircle className="w-8 h-8 text-blue-700" />,
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200',
          shadowColor: 'shadow-blue-100'
        };
    }
  };

  // Use the current assessment for display
  const activeRiskAssessment = currentAssessment.riskAssessment || riskAssessment;
  const activeScore = currentAssessment.score;
  const activeCancerType = currentAssessment.cancerType;
  
  if (!activeRiskAssessment) return null;
  
  const riskInfo = getRiskLevelInfo(activeRiskAssessment.risk_level);
  
  const formattedCancerType = activeCancerType 
    ? activeCancerType.charAt(0).toUpperCase() + activeCancerType.slice(1) 
    : "General";
  
  const foodLimit = 4;
  const precautionLimit = 3;
  
  const displayEatFoods = showAllFoods 
    ? activeRiskAssessment.foods_to_eat 
    : activeRiskAssessment.foods_to_eat.slice(0, foodLimit);
    
  const displayAvoidFoods = showAllFoods 
    ? activeRiskAssessment.foods_to_avoid 
    : activeRiskAssessment.foods_to_avoid.slice(0, foodLimit);
    
  const displayPrecautions = showAllPrecautions
    ? activeRiskAssessment.precautions || []
    : (activeRiskAssessment.precautions || []).slice(0, precautionLimit);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.2,
        duration: 0.5
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  const foodItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i: number) => ({ 
      opacity: 1, 
      x: 0,
      transition: { 
        delay: i * 0.1,
        duration: 0.3
      }
    })
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="bg-gradient-to-br from-white to-purple-50 rounded-xl border border-purple-200 shadow-lg p-8 relative overflow-hidden"
    >
      <div className="absolute -top-20 -right-20 w-60 h-60 bg-purple-200 rounded-full opacity-20"></div>
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-200 rounded-full opacity-20"></div>
      
      <motion.div variants={itemVariants} className="text-center mb-8 relative z-10">
        <h2 className="text-3xl font-bold mb-2 text-gradient bg-gradient-to-r from-cancer-blue to-cancer-purple bg-clip-text text-transparent">
          Your Cancer Risk Assessment
        </h2>
        <p className="text-gray-600">
          Based on your responses, we've generated a personalized assessment for your risk factors.
        </p>
      </motion.div>

      {/* Assessment Type Selector */}
      {hasMultipleAssessments && (
        <motion.div variants={itemVariants} className="mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-purple-100 p-4">
            <h3 className="text-lg font-semibold mb-3 text-cancer-purple">
              Assessment Results
            </h3>
            <div className="grid gap-3">
              {allRiskAssessments.map((assessment, index) => {
                const isActive = index === selectedAssessmentIndex;
                const riskLevel = assessment.riskAssessment?.risk_level || "Unknown";
                const riskInfo = getRiskLevelInfo(riskLevel);
                
                return (
                  <button 
                    key={index}
                    onClick={() => setSelectedAssessmentIndex(index)}
                    className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                      isActive 
                        ? 'bg-purple-100 border-2 border-purple-300' 
                        : 'bg-gray-50 hover:bg-purple-50 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full mr-3 ${riskInfo.color}`}>
                        {riskInfo.icon}
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium">
                          {assessment.cancerType.charAt(0).toUpperCase() + assessment.cancerType.slice(1)} Cancer
                        </h4>
                        <p className={`text-sm ${riskInfo.textColor}`}>
                          Risk Level: {riskLevel} (Score: {assessment.score})
                        </p>
                      </div>
                    </div>
                    {isActive && <Check className="w-5 h-5 text-purple-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Current Assessment Result */}
      <motion.div 
        variants={itemVariants}
        className={`flex flex-col md:flex-row items-center justify-center mb-8 gap-6 p-6 rounded-2xl ${riskInfo.borderColor} ${riskInfo.shadowColor} border-2 bg-white/80 backdrop-blur-sm`}
      >
        <motion.div 
          className={`p-6 rounded-full ${riskInfo.color}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          {riskInfo.icon}
        </motion.div>
        <div className="text-center md:text-left">
          <h3 className="text-2xl font-semibold mb-2">Score: {activeScore}</h3>
          <div className={`text-xl font-medium ${riskInfo.textColor}`}>
            Risk Level: {activeRiskAssessment.risk_level}
          </div>
          {activeCancerType && activeCancerType !== "general" && (
            <div className="mt-2 text-lg">
              Cancer Type: {formattedCancerType}
            </div>
          )}
        </div>
      </motion.div>

      <motion.div 
        variants={itemVariants}
        className="mb-8 bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-purple-100 p-6"
      >
        <h3 className="text-xl font-semibold mb-3 text-cancer-purple flex items-center">
          <BookOpen className="w-5 h-5 mr-2" />
          Personalized Advice
        </h3>
        <p className="text-gray-700 bg-gray-50 p-6 rounded-lg border border-gray-100 leading-relaxed">
          {activeRiskAssessment.advice}
        </p>
      </motion.div>

      {activeRiskAssessment.precautions && activeRiskAssessment.precautions.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="mb-8 bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-blue-100 p-6"
        >
          <h3 className="text-xl font-semibold mb-3 text-blue-700 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Recommended Precautions
          </h3>
          <ul className="bg-blue-50 p-4 rounded-lg space-y-2">
            {displayPrecautions.map((precaution, index) => (
              <motion.li
                key={index}
                custom={index}
                variants={foodItemVariants}
                className="flex items-start p-2 hover:bg-white/60 rounded-md transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-blue-600 mr-2 mt-1 flex-shrink-0" />
                <span>{precaution}</span>
              </motion.li>
            ))}
          </ul>
          
          {activeRiskAssessment.precautions.length > precautionLimit && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setShowAllPrecautions(!showAllPrecautions)}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-2 transition-colors"
              >
                {showAllPrecautions ? 'Show fewer precautions' : 'Show all precautions'}
                <ArrowRight className={`w-4 h-4 transition-transform ${showAllPrecautions ? 'rotate-90' : ''}`} />
              </button>
            </div>
          )}
        </motion.div>
      )}

      <motion.div 
        variants={itemVariants}
        className="grid md:grid-cols-2 gap-6 mb-6"
      >
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-green-100 p-6">
          <h3 className="text-xl font-semibold mb-3 flex items-center text-green-700">
            <Utensils className="w-5 h-5 mr-2" />
            Foods to Include
          </h3>
          <ul className="bg-green-50 p-4 rounded-lg space-y-2">
            {displayEatFoods.map((food, index) => (
              <motion.li 
                key={index} 
                custom={index}
                variants={foodItemVariants}
                className="flex items-start p-2 hover:bg-white/60 rounded-md transition-colors"
              >
                <Check className="w-4 h-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                <span>{food}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-red-100 p-6">
          <h3 className="text-xl font-semibold mb-3 flex items-center text-red-700">
            <X className="w-5 h-5 mr-2" />
            Foods to Avoid
          </h3>
          <ul className="bg-red-50 p-4 rounded-lg space-y-2">
            {displayAvoidFoods.map((food, index) => (
              <motion.li 
                key={index}
                custom={index}
                variants={foodItemVariants}
                className="flex items-start p-2 hover:bg-white/60 rounded-md transition-colors"
              >
                <X className="w-4 h-4 text-red-600 mr-2 mt-1 flex-shrink-0" />
                <span>{food}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </motion.div>

      {(activeRiskAssessment.foods_to_eat.length > foodLimit || activeRiskAssessment.foods_to_avoid.length > foodLimit) && (
        <motion.div variants={itemVariants} className="flex justify-center mb-8">
          <button 
            onClick={() => setShowAllFoods(!showAllFoods)}
            className="text-cancer-purple hover:text-cancer-blue flex items-center gap-2 transition-colors"
          >
            {showAllFoods ? 'Show fewer dietary recommendations' : 'Show all dietary recommendations'}
            <ArrowRight className={`w-4 h-4 transition-transform ${showAllFoods ? 'rotate-90' : ''}`} />
          </button>
        </motion.div>
      )}

      {/* All Assessments in Detail (collapsible) */}
      {hasMultipleAssessments && (
        <motion.div variants={itemVariants} className="mb-8">
          <Accordion type="single" collapsible className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-purple-100 overflow-hidden">
            <AccordionItem value="all-assessments">
              <AccordionTrigger className="px-6 py-4 text-cancer-purple hover:text-cancer-blue">
                <span className="flex items-center gap-2">
                  View All Assessment Results
                </span>
              </AccordionTrigger>
              <AccordionContent className="p-4">
                <div className="space-y-6">
                  {allRiskAssessments.map((assessment, index) => {
                    if (!assessment.riskAssessment) return null;
                    
                    const assessRiskInfo = getRiskLevelInfo(assessment.riskAssessment.risk_level);
                    const cancerName = assessment.cancerType.charAt(0).toUpperCase() + assessment.cancerType.slice(1);
                    
                    return (
                      <div 
                        key={index}
                        className={`p-4 rounded-lg border-2 ${assessRiskInfo.borderColor}`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 rounded-full ${assessRiskInfo.color}`}>
                            {assessRiskInfo.icon}
                          </div>
                          <div>
                            <h4 className="font-medium">{cancerName} Cancer</h4>
                            <p className={assessRiskInfo.textColor}>
                              {assessment.riskAssessment.risk_level} Risk (Score: {assessment.score})
                            </p>
                          </div>
                        </div>
                        
                        <p className="mb-2 text-sm bg-gray-50 p-3 rounded">
                          {assessment.riskAssessment.advice.length > 120 
                            ? `${assessment.riskAssessment.advice.substring(0, 120)}...` 
                            : assessment.riskAssessment.advice}
                        </p>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="w-full justify-between"
                            >
                              <span>View Details</span>
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                            <div className="py-4">
                              <h3 className="text-xl font-bold mb-4 text-cancer-purple">
                                {cancerName} Cancer Assessment
                              </h3>
                              
                              <div className={`flex items-center gap-3 p-3 rounded-lg ${assessRiskInfo.color.replace('text-', 'bg-opacity-20 text-')}`}>
                                {assessRiskInfo.icon}
                                <div>
                                  <p className="font-medium">{assessment.riskAssessment.risk_level} Risk Level</p>
                                  <p>Score: {assessment.score}</p>
                                </div>
                              </div>
                              
                              <div className="mt-4 space-y-4">
                                <div>
                                  <h4 className="font-medium">Advice</h4>
                                  <p className="mt-1 p-3 bg-gray-50 rounded">
                                    {assessment.riskAssessment.advice}
                                  </p>
                                </div>
                                
                                <div className="grid md:grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium text-green-700 flex items-center gap-2">
                                      <Check className="w-4 h-4" /> Foods to Include
                                    </h4>
                                    <ul className="mt-1 bg-green-50 p-3 rounded space-y-1">
                                      {assessment.riskAssessment.foods_to_eat.map((food, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                          <Check className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                                          <span>{food}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  
                                  <div>
                                    <h4 className="font-medium text-red-700 flex items-center gap-2">
                                      <X className="w-4 h-4" /> Foods to Avoid
                                    </h4>
                                    <ul className="mt-1 bg-red-50 p-3 rounded space-y-1">
                                      {assessment.riskAssessment.foods_to_avoid.map((food, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                          <X className="w-4 h-4 text-red-600 mt-1 flex-shrink-0" />
                                          <span>{food}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                                
                                {assessment.riskAssessment.precautions && assessment.riskAssessment.precautions.length > 0 && (
                                  <div>
                                    <h4 className="font-medium text-blue-700 flex items-center gap-2">
                                      <ShieldCheck className="w-4 h-4" /> Recommended Precautions
                                    </h4>
                                    <ul className="mt-1 bg-blue-50 p-3 rounded space-y-1">
                                      {assessment.riskAssessment.precautions.map((precaution, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                          <ShieldCheck className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                                          <span>{precaution}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>
      )}

      <motion.div 
        variants={itemVariants}
        className="flex justify-center mt-8"
      >
        <Button 
          onClick={resetQuiz}
          className="bg-gradient-to-r from-cancer-blue to-cancer-purple hover:from-cancer-purple hover:to-cancer-blue transition-all duration-300 transform hover:scale-105 text-white px-6 py-2 rounded-full flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Take the Quiz Again
        </Button>
      </motion.div>
    </motion.div>
  );
};

// Helper component for the chevron icon
const ChevronRight = ({ className }: { className?: string }) => {
  return <ChevronDown className={className} />;
};

export default QuizResults;
