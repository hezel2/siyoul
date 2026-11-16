import { useEffect, useRef, useState } from 'react';
import { Header, type AppPage } from './components/Header';
import { HeroView } from './components/HeroView';
import { SajuInputForm } from './components/SajuInputForm';
import { LoadingView } from './components/LoadingView';
import { ResultView } from './components/ResultView';
import { ArchiveView } from './components/ArchiveView';
import { FirebaseProvider, useFirebase } from './contexts/FirebaseContext';
import { saveSajuReading } from './services/sajuRepository';
import { trackEvent } from './utils/analytics';
import { auth } from './firebase';
import type {
  SajuAnalysisResponse,
  SajuInput,
  SavedSajuReading,
} from './types/saju';

const DEFAULT_INPUT: SajuInput = {
  nickname: '',
  birthDate: '1995-05-15',
  calendarType: 'solar',
  isLeapMonth: false,
  birthTime: {
    hour: 12,
    minute: 0,
    unknown: false,
  },
  gender: 'unspecified',
  timezone: 'Asia/Seoul',
};

function SajuAppShell() {
  const { user, readings } = useFirebase();
  const [page, setPage] = useState<AppPage>('hero');
  const [formInput, setFormInput] = useState<SajuInput>(DEFAULT_INPUT);
  const [analysisResult, setAnalysisResult] = useState<SajuAnalysisResponse | null>(null);
  const [activeReadingId, setActiveReadingId] = useState<string | null>(null);
  const [savePending, setSavePending] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    trackEvent('page_view');
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeSavedReading =
    activeReadingId
      ? readings.find((r) => r.id === activeReadingId) ?? null
      : null;

  const handleStartSaju = () => {
    trackEvent('hero_cta_click');
    setAnalysisError(null);
    setSaveError(null);
    setPage('input');
    scrollToTop();
  };

  const handleNavigateHome = () => {
    setPage('hero');
    scrollToTop();
  };

  const handleOpenArchive = () => {
    setPage('archive');
    scrollToTop();
  };

  const handleJumpSection = (sectionId: string) => {
    if (page !== 'hero') {
      setPage('hero');
      window.setTimeout(() => {
        const el = document.getElementById(sectionId);
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    } else {
      const el = document.getElementById(sectionId);
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const persistAnalysis = async (payload: SajuAnalysisResponse) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    setSavePending(true);
    setSaveError(null);
    try {
      const saved = await saveSajuReading(currentUser, payload);
      setActiveReadingId(saved.id);
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      setSaveError(
        raw.includes('Quota exceeded')
          ? '일일 데이터베이스 무료 사용량 한도에 도달해 저장하지 못했습니다.'
          : '사주 기록을 보관함에 저장하지 못했습니다. 상단의 저장 버튼을 다시 눌러주세요.'
      );
    } finally {
      setSavePending(false);
    }
  };

  const runAnalysis = async (inputPayload: SajuInput, shouldSave: boolean) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setFormInput(inputPayload);
    setAnalysisError(null);
    setSaveError(null);
    setActiveReadingId(null);
    setPage('loading');
    scrollToTop();

    try {
      const response = await fetch('/api/saju/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputPayload),
      });

      const data = (await response.json()) as Partial<SajuAnalysisResponse> & {
        error?: string;
      };

      if (!response.ok || !data.calculation || !data.report) {
        throw new Error(
          data.error || '사주 풀이 생성 중 일시적인 문제가 발생했습니다.'
        );
      }

      const fullResult = data as SajuAnalysisResponse;
      trackEvent('saju_calculation_success');
      trackEvent('gemini_request_success');
      setAnalysisResult(fullResult);
      setPage('result');
      trackEvent('result_view');
      scrollToTop();

      if (shouldSave && auth.currentUser) {
        void persistAnalysis(fullResult);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : '네트워크 연결 상태를 확인한 뒤 다시 시도해주세요.';
      setAnalysisError(message);
    } finally {
      inFlightRef.current = false;
    }
  };

  const [lastShouldSave, setLastShouldSave] = useState<boolean>(true);

  const handleSubmitForm = (inputPayload: SajuInput, shouldSave: boolean) => {
    trackEvent('form_submit');
    setLastShouldSave(shouldSave);
    void runAnalysis(inputPayload, shouldSave);
  };

  const handleRetry = () => {
    trackEvent('retry_click');
    void runAnalysis(formInput, lastShouldSave);
  };

  const handleRestart = () => {
    setAnalysisError(null);
    setSaveError(null);
    setPage('input');
    scrollToTop();
  };

  const handleOpenSavedReading = (reading: SavedSajuReading) => {
    setAnalysisResult(reading);
    setActiveReadingId(reading.id);
    setSaveError(null);
    setPage('result');
    scrollToTop();
  };

  return (
    <div className="min-h-screen bg-[#11110F] text-[#F3EFE5]">
      <Header
        currentPage={page}
        savedCount={readings.length}
        isSignedIn={Boolean(user)}
        onNavigateHome={handleNavigateHome}
        onStartSaju={handleStartSaju}
        onOpenArchive={handleOpenArchive}
        onJumpSection={handleJumpSection}
      />

      <main>
        {page === 'hero' && <HeroView onStart={handleStartSaju} />}

        {page === 'input' && (
          <SajuInputForm
            initialValue={formInput}
            isSubmitting={inFlightRef.current}
            onBack={handleNavigateHome}
            onFormStart={() => trackEvent('form_start')}
            onSubmit={handleSubmitForm}
          />
        )}

        {page === 'loading' && (
          <LoadingView
            error={analysisError}
            onRetry={handleRetry}
            onEditInput={() => {
              setAnalysisError(null);
              setPage('input');
              scrollToTop();
            }}
          />
        )}

        {page === 'result' && analysisResult && (
          <ResultView
            result={analysisResult}
            savedReading={activeSavedReading}
            savePending={savePending}
            saveError={saveError}
            onSaveToArchive={async () => {
              await persistAnalysis(analysisResult);
            }}
            onOpenArchive={handleOpenArchive}
            onRestart={handleRestart}
            onShareEvent={(phase) =>
              trackEvent(phase === 'click' ? 'share_click' : 'share_success')
            }
          />
        )}

        {page === 'archive' && (
          <ArchiveView
            onBackHome={handleNavigateHome}
            onStartNew={handleStartSaju}
            onOpenReading={handleOpenSavedReading}
          />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <SajuAppShell />
    </FirebaseProvider>
  );
}
