import { motion, useReducedMotion } from 'motion/react';

const STEMS_HANJA = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCHES_HANJA = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

interface CelestialAstrolabeProps {
  size?: 'hero' | 'loading';
  className?: string;
}

export function CelestialAstrolabe({
  size = 'hero',
  className = '',
}: CelestialAstrolabeProps) {
  const shouldReduceMotion = useReducedMotion();
  const dimensions = size === 'loading' ? 'w-64 h-64 sm:w-72 sm:h-72' : 'w-72 h-72 sm:w-96 sm:h-96 lg:w-[440px] lg:h-[440px]';

  return (
    <div
      className={`relative flex items-center justify-center select-none ${dimensions} ${className}`}
      aria-hidden="true"
    >
      {/* Subtle outer gold halo */}
      <div className="absolute inset-4 rounded-full bg-[radial-gradient(circle,rgba(198,167,106,0.14)_0%,rgba(17,17,15,0)_70%)]" />

      {/* Outer Ring: 12 Earthly Branches */}
      <motion.svg
        viewBox="0 0 400 400"
        className="absolute inset-0 h-full w-full"
        animate={
          shouldReduceMotion
            ? undefined
            : { rotate: 360 }
        }
        transition={
          shouldReduceMotion
            ? undefined
            : {
                duration: size === 'loading' ? 36 : 90,
                repeat: Infinity,
                ease: 'linear',
              }
        }
      >
        <circle
          cx="200"
          cy="200"
          r="190"
          fill="none"
          stroke="#4B4030"
          strokeWidth="1"
          strokeOpacity="0.65"
        />
        <circle
          cx="200"
          cy="200"
          r="156"
          fill="none"
          stroke="#4B4030"
          strokeWidth="0.75"
          strokeDasharray="3 6"
          strokeOpacity="0.7"
        />

        {BRANCHES_HANJA.map((char, idx) => {
          const angleDeg = idx * 30 - 90;
          const angleRad = (angleDeg * Math.PI) / 180;
          const r = 173;
          const x = 200 + Math.cos(angleRad) * r;
          const y = 200 + Math.sin(angleRad) * r;
          const tickX1 = 200 + Math.cos(angleRad) * 186;
          const tickY1 = 200 + Math.sin(angleRad) * 186;
          const tickX2 = 200 + Math.cos(angleRad) * 192;
          const tickY2 = 200 + Math.sin(angleRad) * 192;

          return (
            <g key={char}>
              <line
                x1={tickX1}
                y1={tickY1}
                x2={tickX2}
                y2={tickY2}
                stroke="#C6A76A"
                strokeWidth="1"
                strokeOpacity="0.45"
              />
              <text
                x={x}
                y={y}
                fill="#A9A396"
                fontSize="15"
                fontFamily="'Noto Serif KR', serif"
                textAnchor="middle"
                dominantBaseline="central"
                transform={`rotate(${angleDeg + 90}, ${x}, ${y})`}
              >
                {char}
              </text>
            </g>
          );
        })}
      </motion.svg>

      {/* Inner Ring: 10 Heavenly Stems (counter-rotating) */}
      <motion.svg
        viewBox="0 0 400 400"
        className="absolute inset-0 h-full w-full"
        animate={
          shouldReduceMotion
            ? undefined
            : { rotate: -360 }
        }
        transition={
          shouldReduceMotion
            ? undefined
            : {
                duration: size === 'loading' ? 28 : 72,
                repeat: Infinity,
                ease: 'linear',
              }
        }
      >
        <circle
          cx="200"
          cy="200"
          r="134"
          fill="none"
          stroke="#C6A76A"
          strokeWidth="0.9"
          strokeOpacity="0.45"
        />
        <circle
          cx="200"
          cy="200"
          r="96"
          fill="none"
          stroke="#4B4030"
          strokeWidth="0.9"
          strokeOpacity="0.7"
        />

        {STEMS_HANJA.map((char, idx) => {
          const angleDeg = idx * 36 - 90;
          const angleRad = (angleDeg * Math.PI) / 180;
          const r = 115;
          const x = 200 + Math.cos(angleRad) * r;
          const y = 200 + Math.sin(angleRad) * r;

          return (
            <text
              key={char}
              x={x}
              y={y}
              fill="#E2CA91"
              fontSize="14"
              fontFamily="'Noto Serif KR', serif"
              textAnchor="middle"
              dominantBaseline="central"
              fillOpacity="0.88"
              transform={`rotate(${angleDeg + 90}, ${x}, ${y})`}
            >
              {char}
            </text>
          );
        })}
      </motion.svg>

      {/* Center: Yin-Yang Harmony Seal */}
      <svg viewBox="0 0 120 120" className="relative h-24 w-24 sm:h-28 sm:w-28">
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="#1B1A17"
          stroke="#C6A76A"
          strokeWidth="1.2"
          strokeOpacity="0.7"
        />
        {/* Yin-Yang Path */}
        <path
          d="M 60 16 A 44 44 0 0 1 60 104 A 22 22 0 0 1 60 60 A 22 22 0 0 0 60 16 Z"
          fill="#C6A76A"
          fillOpacity="0.85"
        />
        <path
          d="M 60 16 A 44 44 0 0 0 60 104 A 22 22 0 0 0 60 60 A 22 22 0 0 1 60 16 Z"
          fill="#11110F"
        />
        <circle cx="60" cy="38" r="5" fill="#11110F" />
        <circle cx="60" cy="82" r="5" fill="#C6A76A" fillOpacity="0.9" />
        <circle
          cx="60"
          cy="60"
          r="44"
          fill="none"
          stroke="#C6A76A"
          strokeWidth="1"
          strokeOpacity="0.6"
        />
      </svg>
    </div>
  );
}
