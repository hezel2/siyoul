import type { ReactNode } from 'react';

export type AppPage = 'hero' | 'input' | 'loading' | 'result';

interface HeaderProps {
  currentPage: AppPage;
  onNavigateHome: () => void;
  onStartSaju: () => void;
  onJumpSection: (sectionId: string) => void;
}

export function Header({
  currentPage,
  onNavigateHome,
  onStartSaju,
  onJumpSection,
}: HeaderProps): ReactNode {
  return (
    <header className="sticky top-0 z-40 border-b border-[#4B4030]/55 bg-[#11110F]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single-element Wordmark */}
        <button
          type="button"
          onClick={onNavigateHome}
          className="font-serif-kr text-lg font-semibold tracking-wider text-[#F3EFE5] transition-colors duration-150 hover:text-[#E2CA91] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C6A76A] whitespace-nowrap shrink-0 cursor-pointer"
        >
          시율 時律
        </button>

        {/* Zone 2: Clean single-line text nav links */}
        <nav
          aria-label="주요 메뉴"
          className="hidden md:flex items-center gap-7 text-sm text-[#A9A396]"
        >
          <button
            type="button"
            onClick={() => onJumpSection('overview')}
            className="underline-offset-4 transition-colors duration-150 hover:text-[#F3EFE5] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C6A76A] whitespace-nowrap shrink-0 cursor-pointer"
          >
            서비스 소개
          </button>
          <button
            type="button"
            onClick={() => onJumpSection('methodology')}
            className="underline-offset-4 transition-colors duration-150 hover:text-[#F3EFE5] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C6A76A] whitespace-nowrap shrink-0 cursor-pointer"
          >
            만세력 기준
          </button>
          <button
            type="button"
            onClick={() => onJumpSection('privacy')}
            className="underline-offset-4 transition-colors duration-150 hover:text-[#F3EFE5] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C6A76A] whitespace-nowrap shrink-0 cursor-pointer"
          >
            개인정보 보호
          </button>
          <button
            type="button"
            onClick={onStartSaju}
            className={`underline-offset-4 transition-colors duration-150 hover:text-[#F3EFE5] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C6A76A] whitespace-nowrap shrink-0 cursor-pointer ${
              currentPage === 'input' ? 'text-[#E2CA91]' : ''
            }`}
          >
            정보 입력
          </button>
        </nav>

        {/* Zone 3: 1 Primary CTA */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onStartSaju}
            className="rounded-sm border border-[#C6A76A]/80 bg-[#C6A76A] px-5 py-2 text-xs sm:text-sm font-medium text-[#11110F] transition-all duration-200 hover:bg-[#E2CA91] hover:shadow-[0_0_20px_rgba(198,167,106,0.28)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E2CA91] whitespace-nowrap shrink-0 cursor-pointer"
          >
            나의 사주 보기
          </button>
        </div>
      </div>
    </header>
  );
}
