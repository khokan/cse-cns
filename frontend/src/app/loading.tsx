'use client';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      {/* Main container with glassmorphism effect */}
      <div className="relative flex flex-col items-center justify-center gap-8 px-8">
        {/* Animated gradient background circle */}
        <div className="relative w-32 h-32">
          {/* Outer rotating ring */}
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary border-r-primary"
            style={{
              animation: 'spin 2s cubic-bezier(0.34, 1.56, 0.64, 1) infinite',
            }}
          />

          {/* Middle rotating ring (counter-clockwise) */}
          <div
            className="absolute inset-2 rounded-full border-4 border-transparent border-b-primary border-l-primary opacity-60"
            style={{
              animation: 'spin 3s cubic-bezier(0.34, 1.56, 0.64, 1) reverse infinite',
            }}
          />

          {/* Inner pulsing circle */}
          <div
            className="absolute inset-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/5"
            style={{
              animation: 'pulse 2s ease-in-out infinite',
              boxShadow: '0 0 20px rgba(var(--primary-rgb), 0.3)',
            }}
          />

          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary shadow-lg" />
        </div>

        {/* Animated text with gradient */}
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Skill Bridge
          </h2>
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground font-medium">Loading your journey</span>
            <div className="flex gap-1">
              <span
                className="w-1.5 h-1.5 rounded-full bg-primary"
                style={{ animation: 'bounce 1.4s ease-in-out 0s infinite' }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-primary"
                style={{ animation: 'bounce 1.4s ease-in-out 0.2s infinite' }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-primary"
                style={{ animation: 'bounce 1.4s ease-in-out 0.4s infinite' }}
              />
            </div>
          </div>
        </div>

        {/* Floating particles background effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-primary/40"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${3 + i}s ease-in-out infinite`,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: translateY(0);
            opacity: 0.8;
          }
          40% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translate(0, 0);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * -100}px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
