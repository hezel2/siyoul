import type { FiveElementKey, SajuAnalysisResponse } from '../types/saju';

const ELEMENT_META: Record<
  FiveElementKey,
  { kr: string; hanja: string; color: string }
> = {
  wood: { kr: '목', hanja: '木', color: '#6B8E6B' },
  fire: { kr: '화', hanja: '火', color: '#B86B52' },
  earth: { kr: '토', hanja: '土', color: '#C6A76A' },
  metal: { kr: '금', hanja: '金', color: '#C8C2B6' },
  water: { kr: '수', hanja: '水', color: '#5F7A94' },
};

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
): number {
  const chars = Array.from(text);
  let line = '';
  let currentY = y;
  let lineCount = 0;

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    if (char === '\n') {
      ctx.fillText(line, x, currentY);
      line = '';
      currentY += lineHeight;
      lineCount += 1;
      if (lineCount >= maxLines) break;
      continue;
    }
    const testLine = line + char;
    if (ctx.measureText(testLine).width > maxWidth && line.length > 0) {
      if (lineCount + 1 >= maxLines) {
        ctx.fillText(line.slice(0, -1) + '…', x, currentY);
        return currentY + lineHeight;
      }
      ctx.fillText(line, x, currentY);
      line = char;
      currentY += lineHeight;
      lineCount += 1;
    } else {
      line = testLine;
    }
  }

  if (line && lineCount < maxLines) {
    ctx.fillText(line, x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

/**
 * Generates a privacy-safe PNG card containing ONLY nickname, 4-pillar Hanja/Hangul,
 * Five Elements distribution, and report summary—never raw birthDate or birthTime.
 */
export async function downloadSajuCardImage(result: SajuAnalysisResponse): Promise<void> {
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('캔버스를 초기화할 수 없습니다.');
  }

  // Deep ink background
  ctx.fillStyle = '#11110F';
  ctx.fillRect(0, 0, width, height);

  // Subtle radial glow
  const grad = ctx.createRadialGradient(540, 320, 40, 540, 320, 620);
  grad.addColorStop(0, 'rgba(198, 167, 106, 0.12)');
  grad.addColorStop(1, 'rgba(17, 17, 15, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Outer editorial frame
  ctx.strokeStyle = 'rgba(198, 167, 106, 0.45)';
  ctx.lineWidth = 2;
  ctx.strokeRect(48, 48, width - 96, height - 96);

  ctx.strokeStyle = 'rgba(75, 64, 48, 0.6)';
  ctx.lineWidth = 1;
  ctx.strokeRect(62, 62, width - 124, height - 124);

  // Top brand mark
  ctx.fillStyle = '#C6A76A';
  ctx.font = '600 22px "Noto Serif KR", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('시율 時律 · AI 사주 리포트', width / 2, 130);

  // Nickname title
  ctx.fillStyle = '#F3EFE5';
  ctx.font = '600 46px "Noto Serif KR", Georgia, serif';
  ctx.fillText(`${result.nickname}님의 사주팔자`, width / 2, 210);

  ctx.fillStyle = '#A9A396';
  ctx.font = '400 22px "Pretendard Variable", "Noto Sans KR", sans-serif';
  ctx.fillText(
    `일간 ${result.calculation.dayMaster.label} · ${result.targetYear}년 풀이`,
    width / 2,
    256
  );

  // 4 Pillar Boxes
  const pillars = [
    { label: '연주 (年柱)', data: result.calculation.pillars.year },
    { label: '월주 (月柱)', data: result.calculation.pillars.month },
    { label: '일주 (日柱)', data: result.calculation.pillars.day, highlight: true },
    { label: '시주 (時柱)', data: result.calculation.pillars.hour },
  ];

  const cardW = 204;
  const cardH = 340;
  const gap = 28;
  const startX = (width - (cardW * 4 + gap * 3)) / 2;
  const startY = 320;

  pillars.forEach((item, idx) => {
    const x = startX + idx * (cardW + gap);
    ctx.fillStyle = item.highlight ? '#24211C' : '#1B1A17';
    ctx.fillRect(x, startY, cardW, cardH);

    ctx.strokeStyle = item.highlight ? '#C6A76A' : '#4B4030';
    ctx.lineWidth = item.highlight ? 2 : 1;
    ctx.strokeRect(x, startY, cardW, cardH);

    ctx.fillStyle = item.highlight ? '#E2CA91' : '#A9A396';
    ctx.font = '500 18px "Pretendard Variable", "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(item.label, x + cardW / 2, startY + 42);

    // Horizontal divider
    ctx.strokeStyle = 'rgba(75, 64, 48, 0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 24, startY + 190);
    ctx.lineTo(x + cardW - 24, startY + 190);
    ctx.stroke();

    if (!item.data) {
      ctx.fillStyle = '#A9A396';
      ctx.font = '400 22px "Noto Serif KR", Georgia, serif';
      ctx.fillText('시간', x + cardW / 2, startY + 135);
      ctx.fillText('미상', x + cardW / 2, startY + 255);
      return;
    }

    const stemMeta = ELEMENT_META[item.data.stemElement];
    const branchMeta = ELEMENT_META[item.data.branchElement];

    ctx.fillStyle = stemMeta.color;
    ctx.font = '700 68px "Noto Serif KR", Georgia, serif';
    ctx.fillText(item.data.stemHanja, x + cardW / 2, startY + 132);

    ctx.fillStyle = '#F3EFE5';
    ctx.font = '400 18px "Pretendard Variable", "Noto Sans KR", sans-serif';
    ctx.fillText(
      `${item.data.stemHangul} · ${stemMeta.kr}`,
      x + cardW / 2,
      startY + 168
    );

    ctx.fillStyle = branchMeta.color;
    ctx.font = '700 68px "Noto Serif KR", Georgia, serif';
    ctx.fillText(item.data.branchHanja, x + cardW / 2, startY + 265);

    ctx.fillStyle = '#F3EFE5';
    ctx.font = '400 18px "Pretendard Variable", "Noto Sans KR", sans-serif';
    ctx.fillText(
      `${item.data.branchHangul} · ${branchMeta.kr}`,
      x + cardW / 2,
      startY + 302
    );
  });

  // Five Elements Strip
  const feY = 720;
  ctx.fillStyle = '#A9A396';
  ctx.font = '500 20px "Pretendard Variable", "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('오행의 균형', width / 2, feY);

  const elements: FiveElementKey[] = ['wood', 'fire', 'earth', 'metal', 'water'];
  const pillW = 160;
  const feGap = 20;
  const feStartX = (width - (pillW * 5 + feGap * 4)) / 2;

  elements.forEach((key, idx) => {
    const x = feStartX + idx * (pillW + feGap);
    const meta = ELEMENT_META[key];
    const count = result.calculation.fiveElements[key];

    ctx.fillStyle = '#1B1A17';
    ctx.fillRect(x, feY + 28, pillW, 88);
    ctx.strokeStyle = 'rgba(75, 64, 48, 0.7)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, feY + 28, pillW, 88);

    ctx.fillStyle = meta.color;
    ctx.font = '600 22px "Noto Serif KR", Georgia, serif';
    ctx.fillText(`${meta.kr}(${meta.hanja})`, x + pillW / 2, feY + 66);

    ctx.fillStyle = '#F3EFE5';
    ctx.font = '600 24px "Pretendard Variable", "Noto Sans KR", sans-serif';
    ctx.fillText(`${count}`, x + pillW / 2, feY + 98);
  });

  // Hairline rule
  ctx.strokeStyle = 'rgba(198, 167, 106, 0.35)';
  ctx.beginPath();
  ctx.moveTo(120, 895);
  ctx.lineTo(width - 120, 895);
  ctx.stroke();

  // Advice / Summary quote
  ctx.fillStyle = '#E2CA91';
  ctx.font = '600 24px "Noto Serif KR", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(result.report.title, width / 2, 955);

  ctx.fillStyle = '#F3EFE5';
  ctx.font = '400 23px "Pretendard Variable", "Noto Sans KR", sans-serif';
  ctx.textAlign = 'left';
  wrapText(ctx, result.report.advice, 120, 1015, width - 240, 38, 5);

  // Footer notice
  ctx.fillStyle = '#A9A396';
  ctx.font = '400 17px "Pretendard Variable", "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    '개인정보 보호를 위해 생년월일 및 출생 시각 원본은 카드에 표시되지 않습니다.',
    width / 2,
    1255
  );

  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `saju-report-${result.targetYear}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
