const DEFAULT_VERSION = "15.23.1";

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

export function getChampionImageUrl({
  championName,
  version = DEFAULT_VERSION,
}: {
  championName: string | null;
  version?: string;
}): string | null {
  // 1. 챔피언 정보가 없으면 null (또는 기본 물음표 이미지)
  if (!championName) return null;

  // 2. Data Dragon URL 반환
  // Fiddlesticks -> Fiddlesticks (API에서 오는 이름이 보통 이미지 파일명과 일치함)
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championName}.png`;
}
/**
 * 포지션(라인) 아이콘 URL 반환
 * @param position - API에서 받은 포지션 문자열 (예: "TOP", "JUNGLE", "UTILITY")
 */
export function getPositionImageUrl(position: string | null): string | null {
  if (!position) return null;

  // API 값 -> 이미지 파일명 매핑
  // (API는 'UTILITY'로 오지만, 실제 파일명은 'utility' 또는 'support' 개념)
  const positionMap: Record<string, string> = {
    TOP: "top",
    JUNGLE: "jungle",
    MIDDLE: "middle",
    MID: "middle", // 혹시 모를 예외 처리
    BOTTOM: "bottom",
    BOT: "bottom",
    UTILITY: "utility",
    SUPPORT: "utility", // 혹시 모를 예외 처리
  };

  const key = positionMap[position.toUpperCase()];

  // 매핑되지 않는 포지션(예: ARAM의 'NONE')은 null 반환
  if (!key) return null;

  // Community Dragon의 공식 SVG 아이콘 경로
  return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/svg/position-${key}.svg`;
}
