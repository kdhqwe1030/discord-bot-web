import Image from "next/image";
import { FaUser } from "react-icons/fa";

const UserProfile = ({ imgUrl }: { imgUrl: string }) => {
  return (
    <div className="w-8 h-8 flex items-center justify-center bg-surface-1  rounded-full overflow-hidden ring-2 ring-sub3">
      {imgUrl === "" ? (
        <FaUser className="text-text-3 " />
      ) : (
        <Image
          src={imgUrl}
          alt="User Avatar"
          width={32}
          height={32}
          className="rounded-full object-cover"
        />
      )}
    </div>
  );
};

export default UserProfile;
