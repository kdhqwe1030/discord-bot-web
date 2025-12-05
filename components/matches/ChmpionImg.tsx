import { getChampionImageUrl } from "@/utils/lolImg";
import Image from "next/image";

const ChmpionImg = ({ championName }: { championName: string }) => {
  const url = getChampionImageUrl({ championName: championName });

  return (
    <div className="relative w-12 h-12 rounded-full overflow-hidden">
      <Image
        src={url || ""}
        alt={"championName"}
        fill
        sizes="48px"
        className="object-cover scale-112"
      />
    </div>
  );
};

export default ChmpionImg;
