
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User, GraduationCap, Settings } from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import UserSettings from "@/components/UserSettings";
import SignInDialog from "@/components/SignInDialog";
import { useUser } from "@/contexts/UserContext";
import { useCoach } from "@/contexts/CoachContext";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useDataService } from "@/hooks/use-data-service";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const { currentUser, isAuthenticated, logout } = useUser();
  const { currentCoach, isAuthenticated: isCoachAuthenticated, logout: coachLogout } = useCoach();
  const dataService = useDataService();

  // Safe way to get court name with fallback
  let courtName = "PickleBook";
  try {
    const settings = dataService.reservationSettings;
    courtName = settings?.courtName || "PickleBook";
  } catch (error) {
    console.warn("Failed to get court name from settings, using fallback:", error);
  }

  // Determine if we're on the coach portal
  const isCoachPortal = location.pathname.startsWith('/coach');

  const navigation = [
    { name: "Book a Court", href: "/", current: true },
    { name: "Book a Coach", href: "/book-coach", current: false },
    { name: "Admin Dashboard", href: "/admin", current: false },
    { name: "Coach Portal", href: "/coach-login", current: false },
  ];

  const closeSheet = () => setIsOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
      <div className="container flex h-16 items-center px-4 sm:px-6">
        {/* Logo */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold text-lg sm:text-xl text-primary">{courtName}</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex ml-8 items-center space-x-6 text-sm font-medium">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="transition-colors hover:text-primary/80 text-foreground"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center space-x-2 sm:space-x-4">
          {/* Show appropriate user menu based on context */}
          {isCoachPortal && isCoachAuthenticated && currentCoach ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="text-sm px-3 py-2 sm:px-4 sm:py-2 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  <span className="hidden sm:inline">{currentCoach.name}</span>
                  <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                    Coach
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled>
                  <div className="flex flex-col space-y-1">
                    <span className="font-medium">{currentCoach.name}</span>
                    <span className="text-xs text-muted-foreground">{currentCoach.email}</span>
                    <Badge variant="secondary" className="text-xs w-fit">
                      Coach
                    </Badge>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={coachLogout} className="text-red-600">
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : isAuthenticated && currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="text-sm px-3 py-2 sm:px-4 sm:py-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{currentUser.name}</span>
                  <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                    {currentUser.membershipType}
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled>
                  <div className="flex flex-col space-y-1">
                    <span className="font-medium">{currentUser.name}</span>
                    <span className="text-xs text-muted-foreground">{currentUser.email}</span>
                    <Badge variant="secondary" className="text-xs w-fit">
                      {currentUser.membershipType}
                    </Badge>
                  </div>
                </DropdownMenuItem>
                {!isCoachPortal && (
                  <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="text-sm px-3 py-2 sm:px-4 sm:py-2"
                title="Sign in (optional - you can book as a guest)"
                onClick={() => setIsSignInOpen(true)}
              >
                Sign In
              </Button>
              <Button
                variant="default"
                className="text-sm px-3 py-2 sm:px-4 sm:py-2"
                asChild
              >
                <Link to="/signup">Sign Up</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="md:hidden p-2"
                size="sm"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col space-y-4 mt-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={closeSheet}
                    className="block px-4 py-3 text-base font-medium text-foreground hover:text-primary/80 hover:bg-muted/50 rounded-lg transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
                {!isCoachPortal && isAuthenticated && currentUser && (
                  <button
                    onClick={() => {
                      setIsSettingsOpen(true);
                      closeSheet();
                    }}
                    className="block px-4 py-3 text-base font-medium text-foreground hover:text-primary/80 hover:bg-muted/50 rounded-lg transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Settings
                    </div>
                  </button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      {/* User Settings Dialog (controlled from dropdown) */}
      {!isCoachPortal && (
        <UserSettings
          currentUserEmail={currentUser?.email}
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
        />
      )}

      {/* Sign In Dialog */}
      <SignInDialog open={isSignInOpen} onOpenChange={setIsSignInOpen} />
    </header>
  );
};

export default Header;
