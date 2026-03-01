import { Link } from "react-router-dom";
import { Button } from "../core/Button";
import { ShieldPlus } from "lucide-react";
import { motion } from "framer-motion";

export function PublicNavbar() {
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link
            to="/"
            className="flex items-center space-x-2 transition-opacity hover:opacity-80"
          >
            <div className="bg-primary-50 p-2 rounded-lg">
              <ShieldPlus className="h-6 w-6 text-primary-600" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              SkinHealth
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Log In
            </Link>
            <Link to="/register">
              <Button>Start Free Screening</Button>
            </Link>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
