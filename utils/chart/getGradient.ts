// 그라데이션 함수
export function getGradient(
  ctx: CanvasRenderingContext2D,
  chartArea: any,
  topColor: string,
  bottomColor: string
) {
  const { top, bottom } = chartArea;
  const gradient = ctx.createLinearGradient(0, top, 0, bottom);

  // 위쪽 (우리 팀 영역)
  gradient.addColorStop(0, topColor);
  gradient.addColorStop(0.5, topColor);

  // 아래쪽 (상대 팀 영역)
  gradient.addColorStop(0.5, bottomColor);
  gradient.addColorStop(1, bottomColor);

  return gradient;
}
