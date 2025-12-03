export function getRankImageUrl({
  tierFlex,
  isMini = true,
}: {
  tierFlex: string | null;
  isMini?: boolean;
}): string | null {
  // 1. 티어 정보가 없으면 null 반환
  if (!tierFlex) return null;

  // 2. "GOLD IV" -> "gold" 변환
  const [tier] = tierFlex.split(" ");
  const key = tier.toLowerCase();

  // 3. isMini 여부에 따라 URL 분기
  if (isMini) {
    return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${key}.svg`;
  }

  return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/${key}.png`;
}
