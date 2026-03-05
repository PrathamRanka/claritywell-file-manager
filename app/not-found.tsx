import { FileQuestion } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="w-8 h-8 text-muted-foreground" />
        </div>
        
        <h2 className="font-display text-2xl font-bold mb-2">Page not found</h2>
        <p className="text-muted-foreground mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <Link
          href="/"
          className="
            inline-flex items-center gap-2 px-6 py-3 rounded-lg
            bg-accent text-accent-foreground hover:bg-accent-hover
            transition-colors focus-ring
          "
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
