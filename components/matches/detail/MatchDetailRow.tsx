import {
  getItemImageUrl,
  getPerkImgUrl,
  getSpellImgUrl,
  getStyleImgUrl,
} from "@/utils/lolImg";
import ChmpionImg from "../ChmpionImg";
import Image from "next/image";
import { Participant } from "./type";

const MatchDetailRow = ({
  player,
  isWinner,
  maxDamage,
  maxDamageTaken,
  matchDuration,
}: {
  player: Participant;
  isWinner: boolean;
  maxDamage: number;
  maxDamageTaken: number;
  matchDuration: number;
}) => {
  const primaryPerkId = player.perks.styles[0].selections[0].perk;
  const subStyleId = player.perks.styles[1].style;

  const rawKda = player.deaths
    ? (player.kills + player.assists) / player.deaths
    : "Perfect";
  const kda = typeof rawKda === "number" ? rawKda.toFixed(2) : rawKda;

  const kdaColor = () => {
    if (kda === "Perfect") return "text-yellow-400";
    const numKda = Number(kda);
    if (numKda >= 5) return "text-purple-500";
    if (numKda >= 3) return "text-green-400";
    if (numKda >= 1) return "text-gray-200";
    return "text-text-4";
  };

  const killPart = player.challenges?.killParticipation;
  const killPartPercent =
    typeof killPart === "number" ? Math.round(killPart * 100) : null;

  const damageDealtRatio =
    maxDamage > 0 ? (player.totalDamageDealtToChampions / maxDamage) * 100 : 0;
  const damageTakenRatio =
    maxDamageTaken > 0 ? (player.totalDamageTaken / maxDamageTaken) * 100 : 0;
  const totalCS = player.totalMinionsKilled + player.neutralMinionsKilled;
  // gameDuration은 상위 컴포넌트에서 props로 받아와야 함 (초 단위)
  const csPerMin = (totalCS / (matchDuration / 60)).toFixed(1);
  const gold = (player.goldEarned / 1000).toFixed(1) + "k";

  const items = [
    player.item0,
    player.item1,
    player.item2,
    player.item3,
    player.item4,
    player.item5,
    player.item6,
  ];
  return (
    <div
      className={`grid grid-cols-[2.5fr_0.8fr_1.8fr_1fr_0.6fr_2fr] gap-1 p-2 rounded-md border-l-4 ${
        isWinner ? "border-win" : "border-lose"
      }`}
    >
      {/* 1. 챔피언 + 스펠 + 이름 */}
      <div className="flex items-center gap-2">
        <ChmpionImg
          championName={player.championName}
          size={8}
          level={player.champLevel}
        />

        {/* 스펠 */}
        <div className="flex flex-col gap-1">
          <Image
            src={getSpellImgUrl(player.summoner1Id)}
            alt="Spell 1"
            width={18}
            height={18}
            className="rounded-xs"
          />
          <Image
            src={getSpellImgUrl(player.summoner2Id)}
            alt="Spell 2"
            width={18}
            height={18}
            className="rounded-xs"
          />
        </div>
        <div className="flex flex-col gap-1">
          {/* 핵심 룬 */}
          <Image
            src={getPerkImgUrl(primaryPerkId)}
            alt="Primary Perk"
            width={18}
            height={18}
            className="rounded-full bg-slate-900/50"
          />
          {/* 보조 룬 스타일 */}
          <Image
            src={getStyleImgUrl(subStyleId)}
            alt="Sub Style"
            width={18}
            height={18}
            className="rounded-full"
          />
        </div>
        {/* 이름 + 챔피언 */}
        <div className="flex flex-col shrink-0">
          <span className="text-xs font-bold text-text-2">
            {player.riotIdGameName || "Unknown"}
            <span className="text-xs text-text-4 font-normal">
              {" "}
              #{player.riotIdTagline}
            </span>
          </span>
          <span className="text-xs text-text-4">{player.championName}</span>
        </div>
      </div>

      {/* 2. KDA + 킬관여 */}
      <div className="text-sm flex flex-col items-center ">
        <span>
          {player.kills} / {player.deaths} / {player.assists}
        </span>
        <div className="text-xs">
          {killPartPercent !== null && (
            <span className="text-text-4">{`(${killPartPercent}%)`}</span>
          )}
          <span className={`ml-1 ${kdaColor()}`}>
            {kda === "Perfect" ? "PERFECT" : kda}
          </span>
        </div>
      </div>

      {/* 3. 가한 피해 / 받은 피해 */}
      <div className="text-xs flex flex-col gap-1 ">
        {/* 가한 피해 */}
        <div className="flex items-center gap-2">
          <span className="w-14 text-right">
            {player.totalDamageDealtToChampions.toLocaleString()}
          </span>
          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-lose"
              style={{ width: `${damageDealtRatio}%` }}
            />
          </div>
        </div>
        {/* 받은 피해 */}
        <div className="flex items-center gap-2">
          <span className="w-14 text-right">
            {player.totalDamageTaken.toLocaleString()}
          </span>
          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-win"
              style={{ width: `${damageTakenRatio}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4. 성장 지표 (CS & 골드) */}
      <div className="text-xs flex flex-col items-center justify-center text-text-3 ">
        <span title={`분당 ${csPerMin}`}>
          CS {totalCS} ({csPerMin})
        </span>
        <span className="text-yellow-500">Gold {gold}</span>
      </div>

      {/* 5. 시야 관련 : 와드 / 점수 */}
      <div className="text-xs flex flex-col items-center justify-center">
        <span>
          {player.wardsPlaced} / {player.detectorWardsPlaced}
        </span>
        <span>점수: {player.visionScore}</span>
      </div>

      {/* 6. 아이템 */}
      <div className="flex gap-1 flex-wrap items-center">
        {items.map((itemId, idx) => {
          const src = getItemImageUrl(itemId);
          return (
            <div
              key={idx}
              className="w-5 h-5 bg-slate-900/70 rounded-sm overflow-hidden flex items-center justify-center"
            >
              {src ? (
                <Image
                  src={src}
                  alt={`item-${idx}`}
                  width={20}
                  height={20}
                  className="object-cover"
                />
              ) : (
                //아이템이 없는 경우
                <div className="bg-surface-1 w-full h-full border-2 border-surface-3" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default MatchDetailRow;
