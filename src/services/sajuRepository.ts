import type { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import type {
  PillarDetail,
  SajuAnalysisResponse,
  SavedSajuReading,
} from '../types/saju';

// Constants synchronized verbatim with firebase-blueprint.json & firestore.rules
const MAX_DISPLAY_NAME = 60;
const MAX_NICKNAME = 24;
const MAX_MEMO = 500;
const ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;

function clip(value: unknown, maxLen: number, fallback = ''): string {
  const str = typeof value === 'string' ? value.trim() : fallback;
  if (!str) return fallback.slice(0, maxLen);
  return str.slice(0, maxLen);
}

function sanitizePillar(p: PillarDetail): PillarDetail {
  return {
    stemHanja: clip(p.stemHanja, 4, '甲'),
    stemHangul: clip(p.stemHangul, 4, '갑'),
    stemElement: p.stemElement,
    stemYinYang: p.stemYinYang,
    branchHanja: clip(p.branchHanja, 4, '子'),
    branchHangul: clip(p.branchHangul, 4, '자'),
    branchElement: p.branchElement,
    branchYinYang: p.branchYinYang,
    animal: clip(p.animal, 12, '쥐'),
    tenGodStem: clip(p.tenGodStem, 16, '비견'),
    tenGodBranch: clip(p.tenGodBranch, 16, '비견'),
  };
}

function generateReadingId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const id = `saju_${Date.now()}_${rand}`;
  return ID_PATTERN.test(id) ? id : `saju_${Date.now()}`;
}

export async function ensureUserProfile(user: User): Promise<void> {
  const userPath = `users/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);
  const displayName = clip(user.displayName || '사용자', MAX_DISPLAY_NAME, '사용자');

  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        displayName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else if (snap.data()?.displayName !== displayName) {
      await updateDoc(userRef, {
        displayName,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

export async function saveSajuReading(
  user: User,
  analysis: SajuAnalysisResponse,
  memo = ''
): Promise<SavedSajuReading> {
  await ensureUserProfile(user);

  const readingId = generateReadingId();
  const path = `users/${user.uid}/readings/${readingId}`;
  const readingRef = doc(db, 'users', user.uid, 'readings', readingId);

  const sanitizedPayload = {
    id: readingId,
    ownerId: user.uid,
    nickname: clip(analysis.nickname, MAX_NICKNAME, '당신'),
    targetYear: Number.isInteger(analysis.targetYear)
      ? Math.min(2100, Math.max(1900, analysis.targetYear))
      : new Date().getFullYear(),
    displayMeta: {
      birthDateLabel: clip(analysis.displayMeta.birthDateLabel, 80, '생년월일'),
      calendarLabel: clip(analysis.displayMeta.calendarLabel, 20, '양력'),
      timeLabel: clip(analysis.displayMeta.timeLabel, 40, '시간 미상'),
      genderLabel: clip(analysis.displayMeta.genderLabel, 20, '성별 미선택'),
    },
    calculation: {
      pillars: {
        year: sanitizePillar(analysis.calculation.pillars.year),
        month: sanitizePillar(analysis.calculation.pillars.month),
        day: sanitizePillar(analysis.calculation.pillars.day),
        hour: analysis.calculation.pillars.hour
          ? sanitizePillar(analysis.calculation.pillars.hour)
          : null,
      },
      fiveElements: {
        wood: Number(analysis.calculation.fiveElements.wood) || 0,
        fire: Number(analysis.calculation.fiveElements.fire) || 0,
        earth: Number(analysis.calculation.fiveElements.earth) || 0,
        metal: Number(analysis.calculation.fiveElements.metal) || 0,
        water: Number(analysis.calculation.fiveElements.water) || 0,
      },
      totalElementsCount:
        analysis.calculation.totalElementsCount === 6 ? 6 : 8,
      dayMaster: {
        stemHanja: clip(analysis.calculation.dayMaster.stemHanja, 4, '甲'),
        stemHangul: clip(analysis.calculation.dayMaster.stemHangul, 4, '갑'),
        element: analysis.calculation.dayMaster.element,
        yinYang: analysis.calculation.dayMaster.yinYang,
        label: clip(analysis.calculation.dayMaster.label, 40, '일간'),
      },
      calculationMetadata: {
        timezone: 'Asia/Seoul' as const,
        birthTimeUnknown: Boolean(
          analysis.calculation.calculationMetadata.birthTimeUnknown
        ),
        calculationMethod: clip(
          analysis.calculation.calculationMetadata.calculationMethod,
          64,
          'lunar-typescript-24jieqi-kst'
        ),
        dayBoundaryPolicy: clip(
          analysis.calculation.calculationMetadata.dayBoundaryPolicy,
          64,
          'kst-midnight-yajasi'
        ),
        solarTermContext: clip(
          analysis.calculation.calculationMetadata.solarTermContext,
          40,
          '절기 기준'
        ),
      },
    },
    report: {
      title: clip(analysis.report.title, 120, '당신의 사주를 읽다'),
      summary: clip(analysis.report.summary, 2000, '사주 요약'),
      sections: {
        overall: {
          title: clip(analysis.report.sections.overall.title, 120, '종합 사주 풀이'),
          content: clip(analysis.report.sections.overall.content, 6000, '-'),
        },
        personality: {
          title: clip(analysis.report.sections.personality.title, 120, '성격운'),
          content: clip(analysis.report.sections.personality.content, 6000, '-'),
        },
        wealth: {
          title: clip(analysis.report.sections.wealth.title, 120, '재물운'),
          content: clip(analysis.report.sections.wealth.content, 6000, '-'),
        },
        love: {
          title: clip(analysis.report.sections.love.title, 120, '연애운'),
          content: clip(analysis.report.sections.love.content, 6000, '-'),
        },
        health: {
          title: clip(analysis.report.sections.health.title, 120, '건강운'),
          content: clip(analysis.report.sections.health.content, 6000, '-'),
        },
        yearly: {
          title: clip(analysis.report.sections.yearly.title, 120, '올해의 운'),
          content: clip(analysis.report.sections.yearly.content, 6000, '-'),
        },
      },
      advice: clip(analysis.report.advice, 1000, '오늘의 흐름을 차분히 살펴보세요.'),
    },
    memo: memo.trim().slice(0, MAX_MEMO),
    isPinned: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(readingRef, sanitizedPayload);
    const now = Date.now();
    return {
      ...analysis,
      id: readingId,
      ownerId: user.uid,
      nickname: sanitizedPayload.nickname,
      targetYear: sanitizedPayload.targetYear,
      displayMeta: sanitizedPayload.displayMeta,
      calculation: sanitizedPayload.calculation,
      report: sanitizedPayload.report,
      memo: sanitizedPayload.memo,
      isPinned: false,
      createdAtMs: now,
      updatedAtMs: now,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeUserReadings(
  user: User,
  onData: (readings: SavedSajuReading[]) => void,
  onError: (err: Error) => void
): () => void {
  const collectionPath = `users/${user.uid}/readings`;
  const q = query(
    collection(db, 'users', user.uid, 'readings'),
    where('ownerId', '==', user.uid)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: SavedSajuReading[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        const createdTs = d.createdAt instanceof Timestamp ? d.createdAt.toMillis() : Date.now();
        const updatedTs = d.updatedAt instanceof Timestamp ? d.updatedAt.toMillis() : createdTs;

        return {
          id: String(d.id || docSnap.id),
          ownerId: String(d.ownerId || user.uid),
          nickname: String(d.nickname || '당신'),
          targetYear: Number(d.targetYear || new Date().getFullYear()),
          displayMeta: d.displayMeta,
          calculation: d.calculation,
          report: d.report,
          memo: typeof d.memo === 'string' ? d.memo : '',
          isPinned: Boolean(d.isPinned),
          createdAtMs: createdTs,
          updatedAtMs: updatedTs,
        };
      });

      list.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return b.createdAtMs - a.createdAtMs;
      });

      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function updateReadingAnnotation(
  user: User,
  readingId: string,
  updates: { memo?: string; isPinned?: boolean }
): Promise<void> {
  const path = `users/${user.uid}/readings/${readingId}`;
  const ref = doc(db, 'users', user.uid, 'readings', readingId);

  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (typeof updates.memo === 'string') {
    payload.memo = updates.memo.trim().slice(0, MAX_MEMO);
  }
  if (typeof updates.isPinned === 'boolean') {
    payload.isPinned = updates.isPinned;
  }

  try {
    await updateDoc(ref, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteUserReading(user: User, readingId: string): Promise<void> {
  const path = `users/${user.uid}/readings/${readingId}`;
  const ref = doc(db, 'users', user.uid, 'readings', readingId);

  try {
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
