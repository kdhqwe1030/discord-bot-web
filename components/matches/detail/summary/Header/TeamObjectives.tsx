import { getObjectiveIconUrl } from "@/utils/lolImg";
import Image from "next/image";

const TeamObjectives = ({
  team,
  side,
  win,
}: {
  team: any;
  side: "left" | "right";
  win: boolean;
}) => {
  const objs = team.objectives;

  // 표시할 오브젝트 목록 정의
  const displayObjs = [
    { key: "baron", label: "Baron" }, //바론
    { key: "dragon", label: "Dragon" }, //드래곤
    { key: "riftHerald", label: "Herald" }, //전령
    { key: "tower", label: "Tower" }, //타워
  ];
  const textColor = win ? "text-win/80" : "text-lose/80";
  return (
    <div
      className={`${
        side === "right" ? "flex-row-reverse text-right" : "flex-row text-left"
      }`}
    >
      <span className={`${textColor} text-sm font-semibold`}>
        {win ? "승리팀" : "패배팀"}
      </span>
      <div
        className={`flex gap-3 ${
          side === "right"
            ? "flex-row-reverse text-right"
            : "flex-row text-left"
        }`}
      >
        {displayObjs.map((obj) => (
          <div key={obj.key} className="flex flex-col items-center gap-0.5">
            <div className="w-6 h-6 relative opacity-80">
              <Image
                src={getObjectiveIconUrl(obj.key as any, win)}
                alt={obj.label}
                fill
                className="object-contain"
              />
            </div>
            <span className="text-xs font-semibold text-gray-300">
              {objs[obj.key].kills}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
export default TeamObjectives;
