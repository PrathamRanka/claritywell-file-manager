interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ message = 'Loading...', size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center">
        <div
          className={`${sizeClasses[size]} border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4`}
        />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
