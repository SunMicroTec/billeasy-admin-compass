
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  LayoutDashboard, 
  PlusCircle, 
  MessageSquare, 
  LogOut, 
  Menu, 
  X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar when route changes on mobile
  React.useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <header className="bg-card border-b border-border flex items-center justify-between p-4 md:px-6 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="md:hidden"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="font-semibold text-lg text-billeasy-purple">BillEasy</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar - Hidden on mobile unless toggled */}
        <aside 
          className={`
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
            md:translate-x-0 fixed md:sticky top-[61px] left-0 w-64 h-[calc(100vh-61px)] 
            bg-sidebar border-r border-sidebar-border z-20 transition-transform duration-200 ease-in-out
          `}
        >
          <nav className="p-4 space-y-2">
            <Link 
              to="/dashboard" 
              className={`flex items-center gap-3 p-3 rounded-md transition-colors hover:bg-sidebar-accent ${location.pathname === '/dashboard' ? 'bg-sidebar-accent text-primary' : 'text-sidebar-foreground'}`}>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>
            
            <Link 
              to="/add-school" 
              className={`flex items-center gap-3 p-3 rounded-md transition-colors hover:bg-sidebar-accent ${location.pathname === '/add-school' ? 'bg-sidebar-accent text-primary' : 'text-sidebar-foreground'}`}>
              <PlusCircle size={18} />
              <span>Add New School</span>
            </Link>
            
            <a 
              href="https://github.com/jay" 
              target="_blank" 
              rel="noreferrer" 
              className="flex items-center gap-3 p-3 rounded-md transition-colors hover:bg-sidebar-accent text-sidebar-foreground">
              <MessageSquare size={18} />
              <span>Contact Developer</span>
            </a>

            <button 
              onClick={onLogout} 
              className="flex w-full items-center gap-3 p-3 rounded-md transition-colors hover:bg-sidebar-accent text-sidebar-foreground mt-auto">
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          {/* Overlay for mobile - closes sidebar when clicked */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden" 
              onClick={toggleSidebar}
            />
          )}
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-card border-t border-border p-4 text-center text-sm text-muted-foreground">
        Created by <a href="https://github.com/jay" className="text-primary hover:underline" target="_blank" rel="noreferrer">Jay</a> for SunMicroTec IT Solutions
      </footer>
    </div>
  );
};

export default Layout;
