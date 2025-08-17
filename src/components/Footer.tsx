
const Footer = () => {
  return (
    <footer className="border-t border-border/60 py-6 md:py-8 bg-muted/30">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © 2025 PickleBook. All rights reserved.
          </p>
        </div>
        <div className="flex gap-4">
          <a
            href="#"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            Terms
          </a>
          <a
            href="#"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            Privacy
          </a>
          <a
            href="#"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
