import { motion } from "framer-motion";
import logoColor from "@/assets/logo-color.png";
import logoWhite from "@/assets/logo-white.png";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* LEFT PANEL — hidden on mobile */}
      <aside
        className="hidden lg:flex flex-col items-center justify-center w-2/5 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)" }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-white/20 pointer-events-none" />
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center px-12 text-center">
          <img src={logoWhite} alt="Blumint Workspace" className="h-14 mb-10" />
          <h1 className="text-white text-4xl font-bold leading-tight">Blumint Workspace</h1>
          <p className="text-white/80 text-base mt-4 max-w-xs leading-relaxed">
            Manage projects, teams, and budgets — all in one place.
          </p>
        </div>
      </aside>

      {/* RIGHT PANEL */}
      <main className="flex flex-1 flex-col items-center justify-center min-h-screen bg-background p-8 lg:p-16">
        {/* Mobile-only logo */}
        <div className="flex items-center justify-center mb-8 lg:hidden">
          <img src={logoColor} alt="Blumint Workspace" className="h-10" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
