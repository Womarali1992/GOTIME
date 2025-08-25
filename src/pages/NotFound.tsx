import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-muted/30 to-background">
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="text-center max-w-md mx-auto">
          <div className="paper-card p-6 sm:p-8 rounded-2xl">
            <div className="mb-6">
              <h1 className="text-6xl sm:text-8xl font-bold text-primary mb-4">404</h1>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
                Page Not Found
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Sorry, we couldn't find the page you're looking for. The page might have been moved or doesn't exist.
              </p>
            </div>
            
            <div className="space-y-3">
              <Button asChild className="w-full sm:w-auto">
                <Link to="/" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Return to Home
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link to="/admin">
                  Go to Admin Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default NotFound;
