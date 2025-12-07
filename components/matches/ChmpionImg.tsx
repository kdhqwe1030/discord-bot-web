import { getChampionImageUrl } from "@/utils/lolImg";
import Image from "next/image";

const ChmpionImg = ({
  championName,
  size = 12,
  level,
}: {
  championName: string;
  size?: number;
  level?: number;
}) => {
  const url = getChampionImageUrl(championName);
  const offset = Math.round(size * 0.5);
  return (
    <div className="relative">
      <div
        className={`relative w-${size} h-${size} rounded-full overflow-hidden`}
      >
        <Image
          src={url || ""}
          alt={"championName"}
          fill
          sizes={`${size * 4}px`}
          className="object-cover scale-112"
        />
      </div>
      {level !== undefined && (
        <div
          className="absolute bg-gray-800 text-white text-[10px] px-1 rounded-full"
          style={{
            bottom: `-${offset}px`,
            right: `-${offset}px`,
          }}
        >
          {level}
        </div>
      )}
    </div>
  );
};

export default ChmpionImg;
