import React from 'react';

interface GaySiamLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const GaySiamLogo: React.FC<GaySiamLogoProps> = ({
  className = '',
  size = 36,
  showText = false,
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 drop-shadow-sm select-none"
      >
        <defs>
          {/* Vibrant Rainbow Pride Gradient */}
          <linearGradient id="gaySiamPride" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF007A" />
            <stop offset="20%" stopColor="#FF5400" />
            <stop offset="40%" stopColor="#FFBD00" />
            <stop offset="60%" stopColor="#00F5D4" />
            <stop offset="80%" stopColor="#00BBF9" />
            <stop offset="100%" stopColor="#9B5DE5" />
          </linearGradient>

          {/* Golden Siam Crown Gradient */}
          <linearGradient id="siamGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE066" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Rainbow Rounded Background Container */}
        <rect
          x="6"
          y="6"
          width="88"
          height="88"
          rx="24"
          fill="url(#gaySiamPride)"
        />

        {/* Glossy Overlay Highlight */}
        <path
          d="M6 30C6 16.7452 16.7452 6 30 6H70C83.2548 6 94 16.7452 94 30V44C60 38 40 50 6 44V30Z"
          fill="white"
          fillOpacity="0.22"
        />

        {/* Pride Heart Silhouette with Thai Siam Elegance */}
        <path
          d="M50 78C50 78 22 61 22 40C22 29.5 30 22 40 22C46 22 49 25 50 27C51 25 54 22 60 22C70 22 78 29.5 78 40C78 61 50 78 50 78Z"
          fill="white"
          fillOpacity="0.96"
        />

        {/* Inner Rainbow Heart Ribbon */}
        <path
          d="M50 72C50 72 28 57 28 40.5C28 32 34 26.5 42 26.5C46.5 26.5 49 29 50 30.5C51 29 53.5 26.5 58 26.5C66 26.5 72 32 72 40.5C72 57 50 72 50 72Z"
          fill="url(#gaySiamPride)"
        />

        {/* Golden Siam Crown Crest in Heart */}
        <path
          d="M42 41L45.5 47L50 39L54.5 47L58 41L56 50H44L42 41Z"
          fill="url(#siamGold)"
          filter="url(#glow)"
        />
        <circle cx="50" cy="36" r="2.2" fill="#FFF7ED" />
        <circle cx="42" cy="38" r="1.6" fill="#FFF7ED" />
        <circle cx="58" cy="38" r="1.6" fill="#FFF7ED" />

        {/* Sparkle Star Accent */}
        <path
          d="M76 14L77.5 19.5L83 21L77.5 22.5L76 28L74.5 22.5L69 21L74.5 19.5L76 14Z"
          fill="url(#siamGold)"
        />
      </svg>

      {showText && (
        <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
          GaySiam
        </span>
      )}
    </div>
  );
};
