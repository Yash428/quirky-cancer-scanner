
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, ChevronRight, 
  LayoutDashboard, FolderSearch, FileText, 
  User, Settings, HelpCircle, LogOut,
  BrainCircuit
} from "lucide-react";

interface DashboardSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const DashboardSidebar = ({ isCollapsed, setIsCollapsed }: DashboardSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      localStorage.removeItem("user");
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log out. Please try again.",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };
  
  const navigationItems = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      path: "/dashboard",
    },
    {
      name: "Scans",
      icon: <FolderSearch size={20} />,
      path: "/scans",
    },
    {
      name: "Reports",
      icon: <FileText size={20} />,
      path: "/reports",
    },
    {
      name: "Quiz",
      icon: <BrainCircuit size={20} />,
      path: "/quiz",
    },
    {
      name: "Profile",
      icon: <User size={20} />,
      path: "/profile",
    },
    {
      name: "Settings",
      icon: <Settings size={20} />,
      path: "/settings",
    },
    {
      name: "Help",
      icon: <HelpCircle size={20} />,
      path: "/help",
    },
  ];
  
  return (
    <motion.div
      initial={false}
      animate={{
        width: isCollapsed ? "80px" : "280px",
        transition: { duration: 0.3, ease: "easeInOut" },
      }}
      className="h-screen bg-gradient-to-b from-purple-50 to-white border-r border-purple-100 overflow-hidden flex flex-col z-20"
    >
      <div className="p-4 border-b border-purple-100 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cancer-blue to-cancer-purple flex items-center justify-center text-white font-bold">
            C
          </div>
          
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden flex-shrink-0"
              >
                <span className="font-bold text-lg bg-gradient-to-r from-cancer-blue to-cancer-purple bg-clip-text text-transparent">
                  CellScan
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
        
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-purple-100"
          onClick={handleToggle}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {navigationItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200 ${
                location.pathname === item.path
                  ? "bg-purple-100 text-cancer-purple"
                  : "text-gray-600 hover:bg-purple-50"
              }`}
            >
              {item.icon}
              
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="whitespace-nowrap"
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          ))}
        </nav>
      </div>
      
      <div className="p-4 border-t border-purple-100">
        <Button
          variant="ghost"
          className={`w-full flex items-center justify-${
            isCollapsed ? "center" : "start"
          } gap-3 text-red-500 hover:bg-red-50 hover:text-red-600`}
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut size={20} />
          
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </div>
    </motion.div>
  );
};

export default DashboardSidebar;
