import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  LogIn,
  LogOut,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { useFirebase } from '../contexts/FirebaseContext';
import {
  deleteUserReading,
  updateReadingAnnotation,
} from '../services/sajuRepository';
import type { SavedSajuReading } from '../types/saju';

interface ArchiveViewProps {
  onBackHome: () => void;
  onStartNew: () => void;
  onOpenReading: (reading: SavedSajuReading) => void;
}

function formatDate(ms: number): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ms));
}

export function ArchiveView({
  onBackHome,
  onStartNew,
  onOpenReading,
}: ArchiveViewProps) {
  const shouldReduceMotion = useReducedMotion();
  const {
    user,
    authReady,
    authBusy,
    authError,
    readings,
    readingsLoading,
    readingsError,
    signInWithGoogle,
    signOutUser,
  } = useFirebase();

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleTogglePin = async (reading: SavedSajuReading) => {
    if (!user || actionBusyId) return;
    setActionBusyId(reading.id);
    setActionError(null);
    try {
      await updateReadingAnnotation(user, reading.id, {
        isPinned: !reading.isPinned,
      });
    } catch {
      setActionError('고정 상태를 변경하지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setActionBusyId(null);
    }
  };

  const handleDelete = async (readingId: string) => {
    if (!user || actionBusyId) return;
    setActionBusyId(readingId);
    setActionError(null);
    try {
      await deleteUserReading(user, readingId);
      setPendingDeleteId(null);
    } catch {
      setActionError('기록을 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setActionBusyId(null);
    }
  };

  return (
    <section className="mx-auto max-w-[1040px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <button
        type="button"
        onClick={onBackHome}
        className="inline-flex min-h-[40px] items-center gap-2 text-sm text-[#A9A396] transition-colors duration-150 hover:text-[#E2CA91] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C6A76A] cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>메인으로 돌아가기</span>
      </button>

      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="mt-6 flex flex-col gap-4 border-b border-[#4B4030]/60 pb-8 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="text-xs tracking-[0.2em] text-[#C6A76A]">개인 사주 보관함</p>
          <h1 className="font-serif-kr mt-3 text-3xl font-semibold text-[#F3EFE5] sm:text-4xl">
            저장된 사주 기록
          </h1>
          <p className="mt-2.5 text-sm text-[#A9A396]">
            분석한 사주 리포트와 개인 메모를 안전하게 보관하고 언제든 다시 펼쳐볼 수 있습니다.
          </p>
        </div>

        {authReady && user && (
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-[#E2CA91]">
              {user.displayName || '사용자'}님
            </span>
            <span aria-hidden="true" className="text-[#4B4030]">·</span>
            <button
              type="button"
              disabled={authBusy}
              onClick={() => void signOutUser()}
              className="inline-flex min-h-[38px] items-center gap-1.5 text-xs sm:text-sm text-[#A9A396] underline-offset-4 transition-colors hover:text-[#F3EFE5] hover:underline disabled:opacity-50 whitespace-nowrap cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>로그아웃</span>
            </button>
          </div>
        )}
      </motion.div>

      {/* Auth loading */}
      {!authReady && (
        <div className="py-20 text-center text-sm text-[#A9A396]">
          계정 상태를 확인하고 있습니다...
        </div>
      )}

      {/* Signed Out View */}
      {authReady && !user && (
        <div className="mt-10 rounded-sm border border-[#4B4030]/75 bg-[#1B1A17] p-8 sm:p-12 text-center">
          <p className="text-xs tracking-[0.2em] text-[#C6A76A]">계정 연결</p>
          <h2 className="font-serif-kr mt-3 text-2xl font-semibold text-[#F3EFE5]">
            Google 로그인으로 사주 기록 보관하기
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#A9A396]">
            로그인하시면 사주 리포트를 개인 계정에 저장해 다른 기기에서도 다시 읽고 메모를 남길 수 있습니다. 로그인하지 않으셔도 게스트로 즉시 사주 풀이를 이용하실 수 있습니다.
          </p>

          {authError && (
            <div
              role="alert"
              className="mx-auto mt-6 flex max-w-md items-start gap-2 rounded-sm border border-[#B86B52]/70 bg-[#B86B52]/10 p-3.5 text-left text-xs sm:text-sm text-[#F3EFE5]"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#B86B52]" />
              <span>{authError}</span>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              disabled={authBusy}
              onClick={() => void signInWithGoogle()}
              className="inline-flex min-h-[48px] items-center gap-2.5 rounded-sm border border-[#C6A76A] bg-[#C6A76A] px-7 py-3 text-sm sm:text-base font-semibold text-[#11110F] transition-all duration-200 hover:bg-[#E2CA91] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E2CA91] disabled:opacity-50 whitespace-nowrap cursor-pointer"
            >
              <LogIn className="h-4 w-4" />
              <span>{authBusy ? '로그인 중...' : 'Google 계정으로 로그인'}</span>
            </button>

            <button
              type="button"
              onClick={onStartNew}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-sm border border-[#4B4030] bg-transparent px-6 py-3 text-sm font-medium text-[#F3EFE5] transition-colors hover:border-[#C6A76A] hover:text-[#E2CA91] whitespace-nowrap cursor-pointer"
            >
              <span>로그인 없이 사주 보기</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Signed In View */}
      {authReady && user && (
        <div className="mt-8">
          {(readingsError || actionError) && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-2.5 rounded-sm border border-[#B86B52]/70 bg-[#B86B52]/10 p-4 text-sm text-[#F3EFE5]"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#B86B52]" />
              <span>{readingsError || actionError}</span>
            </div>
          )}

          {readingsLoading ? (
            <div className="py-16 text-center text-sm text-[#A9A396]">
              저장된 사주 리포트를 불러오고 있습니다...
            </div>
          ) : readings.length === 0 ? (
            <div className="rounded-sm border border-[#4B4030]/65 bg-[#1B1A17] p-10 sm:p-14 text-center">
              <p className="font-serif-kr text-xl font-semibold text-[#F3EFE5]">
                아직 저장된 사주 리포트가 없습니다
              </p>
              <p className="mt-2.5 text-sm text-[#A9A396]">
                새로운 사주를 분석하면 내 보관함에 자동으로 기록됩니다.
              </p>
              <button
                type="button"
                onClick={onStartNew}
                className="mt-7 inline-flex min-h-[46px] items-center gap-2 rounded-sm border border-[#C6A76A] bg-[#C6A76A] px-7 py-2.5 text-sm font-semibold text-[#11110F] transition-colors hover:bg-[#E2CA91] whitespace-nowrap cursor-pointer"
              >
                <span>첫 사주 분석하기</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {readings.map((item) => {
                const p = item.calculation.pillars;
                const pillarsLabel = [
                  `${p.year.stemHanja}${p.year.branchHanja}`,
                  `${p.month.stemHanja}${p.month.branchHanja}`,
                  `${p.day.stemHanja}${p.day.branchHanja}`,
                  p.hour ? `${p.hour.stemHanja}${p.hour.branchHanja}` : '미상',
                ].join(' · ');

                const isDeleting = pendingDeleteId === item.id;
                const isBusy = actionBusyId === item.id;

                return (
                  <article
                    key={item.id}
                    className={`rounded-sm border p-6 transition-colors ${
                      item.isPinned
                        ? 'border-[#C6A76A]/80 bg-[#24211C]'
                        : 'border-[#4B4030]/70 bg-[#1B1A17]'
                    }`}
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#A9A396]">
                          {item.isPinned && (
                            <>
                              <span className="font-medium text-[#E2CA91]">고정된 기록</span>
                              <span aria-hidden="true" className="text-[#4B4030]">·</span>
                            </>
                          )}
                          <span className="tabular-nums">{formatDate(item.createdAtMs)}</span>
                          <span aria-hidden="true" className="text-[#4B4030]">·</span>
                          <span>{item.displayMeta.calendarLabel}</span>
                          <span aria-hidden="true" className="text-[#4B4030]">·</span>
                          <span>{item.displayMeta.timeLabel}</span>
                        </div>

                        <h2 className="font-serif-kr mt-2.5 text-xl sm:text-2xl font-semibold text-[#F3EFE5]">
                          {item.nickname}님의 사주 리포트
                        </h2>

                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                          <span className="font-serif-kr tracking-wider text-[#E2CA91]">
                            {pillarsLabel}
                          </span>
                          <span aria-hidden="true" className="text-[#4B4030]">·</span>
                          <span className="text-[#A9A396]">
                            일간 {item.calculation.dayMaster.label}
                          </span>
                          <span aria-hidden="true" className="text-[#4B4030]">·</span>
                          <span className="text-[#A9A396]">
                            {item.targetYear}년 운세
                          </span>
                        </div>

                        {item.memo && (
                          <p className="mt-3 line-clamp-2 text-xs sm:text-sm leading-relaxed text-[#F3EFE5]/80">
                            메모: {item.memo}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onOpenReading(item)}
                          className="inline-flex min-h-[42px] items-center gap-1.5 rounded-sm border border-[#C6A76A] bg-[#C6A76A] px-5 py-2 text-xs sm:text-sm font-semibold text-[#11110F] transition-colors hover:bg-[#E2CA91] whitespace-nowrap cursor-pointer"
                        >
                          <span>리포트 열기</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleTogglePin(item)}
                          className={`inline-flex min-h-[42px] items-center gap-1.5 rounded-sm border px-3.5 py-2 text-xs sm:text-sm transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer ${
                            item.isPinned
                              ? 'border-[#C6A76A]/70 bg-[#11110F] text-[#E2CA91]'
                              : 'border-[#4B4030] bg-[#11110F] text-[#A9A396] hover:border-[#C6A76A] hover:text-[#F3EFE5]'
                          }`}
                        >
                          <Bookmark className="h-3.5 w-3.5" />
                          <span>{item.isPinned ? '고정 해제' : '고정'}</span>
                        </button>

                        {!isDeleting ? (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => setPendingDeleteId(item.id)}
                            aria-label={`${item.nickname} 사주 기록 삭제`}
                            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-sm border border-[#4B4030] bg-[#11110F] px-3.5 py-2 text-xs sm:text-sm text-[#A9A396] transition-colors hover:border-[#B86B52] hover:text-[#B86B52] disabled:opacity-50 whitespace-nowrap cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>삭제</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => void handleDelete(item.id)}
                              className="min-h-[42px] rounded-sm border border-[#B86B52] bg-[#B86B52] px-3.5 py-2 text-xs font-semibold text-[#11110F] transition-opacity hover:opacity-90 disabled:opacity-50 whitespace-nowrap cursor-pointer"
                            >
                              {isBusy ? '삭제 중...' : '삭제 확인'}
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => setPendingDeleteId(null)}
                              className="min-h-[42px] rounded-sm border border-[#4B4030] px-3 py-2 text-xs text-[#A9A396] hover:text-[#F3EFE5] whitespace-nowrap cursor-pointer"
                            >
                              취소
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
