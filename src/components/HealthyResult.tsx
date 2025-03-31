
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { HeartPulse, Check, Medal } from "lucide-react";

interface HealthyResultProps {
  resetQuiz: () => void;
}

const HealthyResult = ({ resetQuiz }: HealthyResultProps) => {
  // Motion variants
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="bg-gradient-to-br from-white to-green-50 rounded-xl border border-green-200 shadow-lg p-8 relative overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="absolute -top-20 -right-20 w-60 h-60 bg-green-200 rounded-full opacity-20"></div>
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-200 rounded-full opacity-20"></div>
      
      <motion.div variants={itemVariants} className="text-center mb-8 relative z-10">
        <h2 className="text-3xl font-bold mb-2 text-gradient bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          Great News! You're Healthy
        </h2>
        <p className="text-gray-600">
          Based on your responses, we haven't detected any concerning symptoms that would suggest an elevated cancer risk.
        </p>
      </motion.div>

      <motion.div 
        variants={itemVariants}
        className="flex items-center justify-center mb-8 p-6"
      >
        <motion.div 
          className="p-6 rounded-full bg-green-100 text-green-700"
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          <HeartPulse className="w-16 h-16" />
        </motion.div>
      </motion.div>

      <motion.div 
        variants={itemVariants}
        className="mb-8 bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-green-100 p-6"
      >
        <h3 className="text-xl font-semibold mb-3 text-green-700 flex items-center">
          <Medal className="w-5 h-5 mr-2" />
          Maintaining Your Health
        </h3>
        <div className="space-y-4">
          <p className="text-gray-700">
            Even though your current risk appears low, it's important to maintain healthy habits and be proactive about your health.
          </p>
          
          <ul className="bg-green-50 p-4 rounded-lg space-y-3">
            <li className="flex items-start p-2">
              <Check className="w-5 h-5 text-green-600 mr-2 mt-1 flex-shrink-0" />
              <span>Schedule regular check-ups with your healthcare provider</span>
            </li>
            <li className="flex items-start p-2">
              <Check className="w-5 h-5 text-green-600 mr-2 mt-1 flex-shrink-0" />
              <span>Maintain a balanced diet rich in fruits, vegetables, and whole grains</span>
            </li>
            <li className="flex items-start p-2">
              <Check className="w-5 h-5 text-green-600 mr-2 mt-1 flex-shrink-0" />
              <span>Exercise regularly for at least 30 minutes most days of the week</span>
            </li>
            <li className="flex items-start p-2">
              <Check className="w-5 h-5 text-green-600 mr-2 mt-1 flex-shrink-0" />
              <span>Limit alcohol consumption and avoid tobacco products</span>
            </li>
            <li className="flex items-start p-2">
              <Check className="w-5 h-5 text-green-600 mr-2 mt-1 flex-shrink-0" />
              <span>Protect your skin from excessive sun exposure</span>
            </li>
          </ul>
        </div>
      </motion.div>

      <motion.div 
        variants={itemVariants}
        className="flex justify-center mt-8"
      >
        <Button 
          onClick={resetQuiz}
          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-blue-600 hover:to-green-600 transition-all duration-300 transform hover:scale-105 text-white px-6 py-2 rounded-full"
        >
          Take the Quiz Again
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default HealthyResult;
