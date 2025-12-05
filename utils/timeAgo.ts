export function getTimeAgo(startedAt: string | Date) {
  const playDay = new Date(startedAt);
  const now = new Date();

  const diffMs = now.getTime() - playDay.getTime(); // 밀리초 차이
  const diffM = Math.floor(diffMs / (1000 * 60)); // 분
  const diffH = Math.floor(diffM / 60); // 시간
  const diffD = Math.floor(diffH / 24); // 일
  const diffMon =
    now.getFullYear() * 12 +
    now.getMonth() -
    (playDay.getFullYear() * 12 + playDay.getMonth()); // 개월 차이
  const diffY = now.getFullYear() - playDay.getFullYear(); // 년 차이

  if (diffM < 1) return "방금 전";
  if (diffM < 60) return `${diffM}분 전`;
  if (diffH < 24) return `${diffH}시간 전`;
  if (diffD < 30) return `${diffD}일 전`;
  if (diffMon < 12) return `${diffMon}달 전`;
  return `${diffY}년 전`;
}
