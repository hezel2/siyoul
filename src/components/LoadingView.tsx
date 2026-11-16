import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { RotateCcw, ArrowLeft, AlertCircle } from 'lucide-react';
import { CelestialAstrolabe } from './CelestialAstrolabe';
import { GoldParticlesCanvas } from './GoldParticlesCanvas';

const LOADING_MESSAGES = [
  '태어난 시간의 기운을 계산하고 있습니다.',
  '당신의 사주팔자를 구성하고 있습니다.',
  '오행의 균형을 분석하고 있습니다.',
  'AI가 당신만의 이야기를 풀어내고 있습니다.',
];

interface LoadingViewProps {
  error: string | null;
  onRetry: () => void;
  onEditInput: () => void;
}

export function LoadingView({ error, onRetry, onEditInput }: LoadingViewProps) {
  const shouldReduceMotion = useReducedMotion();
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (error) return;
    setStepIndex(0);
    const interval = window.setInterval(() => {
      setStepIndex((prev) => (prev < LOADING_MESSAGES.length - 1 ? prev + 1 : prev));
    }, 2200);
    return () => window.clearInterval(interval);
  }, [error]);

  if (error) {
    return (
      <section className="mx-auto flex min-h-[calc(100vh-64px)] max-w-[640px] flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <div className="w-full rounded-sm border border-[#4B4030]/80 bg-[#1B1A17] p-8 sm:p-10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#B86B52]/50 bg-[#B86B52]/10 text-[#B86B52]">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h1 className="font-serif-kr mt-5 text-2xl font-semibold text-[#F3EFE5]">
            사주 분석을 잠시 멈추었습니다
          </h1>
          <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#A9A396]">
            {error}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-sm border border-[#C6A76A] bg-[#C6A76A] px-6 py-2.5 text-sm font-semibold text-[#11110F] transition-colors hover:bg-[#E2CA91] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E2CA91] cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>다시 시도하기</span>
            </button>
            <button
              type="button"
              onClick={onEditInput}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-sm border border-[#4B4030] bg-transparent px-6 py-2.5 text-sm font-medium text-[#F3EFE5] transition-colors hover:border-[#C6A76A] hover:text-[#E2CA91] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C6A76A] cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>입력 정보 수정하기</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-live="polite"
      className="relative flex min-h-[calc(100vh-64px)] flex-col items-center justify-center overflow-hidden px-4 py-16 text-center"
    >
      <GoldParticlesCanvas mode="converge" />

      <div className="relative z-10 flex flex-col items-center">
        <CelestialAstrolabe size="loading" />

        <h1 className="font-serif-kr mt-8 text-balance text-2xl font-semibold text-[#F3EFE5] sm:text-3xl">
          당신의 시간을 읽고 있습니다.
        </h1>

        <div className="mt-4 h-7 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={stepIndex}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.35 }}
              className="text-sm sm:text-base text-[#E2CA91]"
            >
              {LOADING_MESSAGES[stepIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Step Progress Indicators (4 stages) */}
        <div className="mt-8 grid w-full max-w-md grid-cols-4 gap-2" aria-hidden="true">
          {LOADING_MESSAGES.map((_, idx) => (
            <div
              key={idx}
              className={`h-0.5 transition-colors duration-500 ${
                idx <= stepIndex ? 'bg-[#C6A76A]' : 'bg-[#4B4030]/50'
              }`}
            />
          ))}
        </div>

        <p className="mt-6 text-xs text-[#A9A396]">
          만세력 계산과 AI 개인화 해석이 완료되면 결과 페이지로 자동 이동합니다.
        </p>
      </div>
    </section>
  );
}
