import { getPositionImageUrl } from "@/utils/lolImg";
import Image from "next/image";

const LineImg = ({ line }: { line: string }) => {
  const url = getPositionImageUrl(line);
  return (
    <div className="relative w-4 h-4 rounded-full overflow-hidden">
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

export default LineImg;
