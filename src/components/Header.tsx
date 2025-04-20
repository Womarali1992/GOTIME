
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-xl text-primary">PickleBook</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              to="/"
              className="transition-colors hover:text-foreground/80 text-foreground"
            >
              Book a Court
            </Link>
            <Link
              to="/admin"
              className="transition-colors hover:text-foreground/80 text-muted-foreground"
            >
              Admin Dashboard
            </Link>
          </nav>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <Button>Sign In</Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
