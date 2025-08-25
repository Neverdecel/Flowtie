import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  className = '', 
  text = 'Loading...' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div 
        className={`animate-spin rounded-full border-2 border-gray-300 border-t-primary-600 ${sizeClasses[size]}`}
      />
      {text && (
        <p className={`mt-2 text-gray-500 ${textSizeClasses[size]}`}>
          {text}
        </p>
      )}
    </div>
  );
}

// Centered loading component for full page loading
export function CenteredLoadingSpinner({ 
  size = 'lg', 
  text = 'Loading...' 
}: LoadingSpinnerProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner size={size} text={text} />
    </div>
  );
}

// Inline loading component
export function InlineLoadingSpinner({ 
  size = 'sm', 
  text 
}: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center py-4">
      <LoadingSpinner size={size} text={text} />
    </div>
  );
}