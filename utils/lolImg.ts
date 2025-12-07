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

export function getChampionImageUrl(
  championName: string | null
): string | null {
  // 1. 챔피언 정보가 없으면 null (또는 기본 물음표 이미지)
  if (!championName) return null;

  // 2. Data Dragon URL 반환
  // Fiddlesticks -> Fiddlesticks (API에서 오는 이름이 보통 이미지 파일명과 일치함)
  return `https://ddragon.leagueoflegends.com/cdn/${DEFAULT_VERSION}/img/champion/${championName}.png`;
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
export const getSpellImgUrl = (spellId: number) => {
  const spellMap: Record<number, string> = {
    4: "SummonerFlash", //점멸
    14: "SummonerDot", // 점화
    12: "SummonerTeleport", //텔레포트
    11: "SummonerSmite", //강타
    7: "SummonerHeal", //힐
    6: "SummonerHaste", // 유체화
    3: "SummonerExhaust", // 탈진
    21: "SummonerBarrier", //베리어
    1: "SummonerBoost", // 정화
  };
  const spellName = spellMap[spellId] || "SummonerFlash"; // 기본값 설정
  return `https://ddragon.leagueoflegends.com/cdn/${DEFAULT_VERSION}/img/spell/${spellName}.png`;
};
export const getItemImageUrl = (
  itemId: number | null | undefined
): string | null => {
  // 0 이거나 undefined면 아이템 없음
  if (!itemId) return null;
  return `https://ddragon.leagueoflegends.com/cdn/${DEFAULT_VERSION}/img/item/${itemId}.png`;
};

export const getPerkImgUrl = (perkId: number): string => {
  // 1. 핵심 룬 ID -> 파일 경로 매핑 (주요 룬 다 넣었습니다)
  const perkPathMap: Record<number, string> = {
    // ✨ 정밀 (Precision)
    8005: "precision/presstheattack/presstheattack", // 집중 공격
    8008: "precision/lethaltempo/lethaltempotemp", // 치명적 속도
    8021: "precision/fleetfootwork/fleetfootwork", // 기민한 발놀림
    8010: "precision/conqueror/conqueror", // 정복자

    // 🔴 지배 (Domination)
    8112: "domination/electrocute/electrocute", // 감전
    8124: "domination/predator/predator", // 포식자
    8128: "domination/darkharvest/darkharvest", // 어둠의 수확
    9923: "domination/hailofblades/hailofblades", // 칼날비

    // 🟣 마법 (Sorcery)
    8214: "sorcery/summonaery/summonaery", // 콩콩이 소환
    8229: "sorcery/arcanecomet/arcanecomet", // 신비로운 유성
    8230: "sorcery/phaserush/phaserush", // 난입

    // 🟢 결의 (Resolve)
    8437: "resolve/graspoftheundying/graspoftheundying", // 착취의 손아귀
    8439: "resolve/veteranaftershock/veteranaftershock", // 여진
    8465: "resolve/guardian/guardian", // 수호자

    // 🔵 영감 (Inspiration)
    8351: "inspiration/glacialaugment/glacialaugment", // 빙결 강화
    8360: "inspiration/unsealedspellbook/unsealedspellbook", // 봉인 풀린 주문서
    8369: "inspiration/firststrike/firststrike", // 선제공격
  };

  const path = perkPathMap[perkId];

  return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/styles/${path}.png`;
};

export const getStyleImgUrl = (styleId: number): string => {
  // 룬 빌드 스타일 아이콘 경로
  const styleMap: Record<number, string> = {
    8000: "7201_precision", // 정밀
    8100: "7200_domination", // 지배
    8200: "7202_sorcery", // 마법
    8300: "7203_whimsy", // 영감
    8400: "7204_resolve", // 결의
  };
  const path = styleMap[styleId] || "7200_domination"; // 기본값 지배
  return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/styles/${path}.png`;
};

export const getObjectiveIconUrl = (
  type: "baron" | "dragon" | "tower" | "herald",
  win: boolean
) => {
  const baseUrl =
    "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-match-history/global/default";
  const num = win ? 100 : 200;
  const map: Record<string, string> = {
    baron: `${baseUrl}/baron-${num}.png`, //바론
    dragon: `${baseUrl}/dragon-${num}.png`, //드래곤
    tower: `${baseUrl}/tower-${num}.png`, //타워
    herald: `${baseUrl}/herald-${num}.png`, //전령
  };

  return map[type] || map["baron"]; // 기본값
};
