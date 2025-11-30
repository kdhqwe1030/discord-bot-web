import Image from "next/image";
import { FaUser } from "react-icons/fa";

const UserProfile = ({ imgUrl }: { imgUrl: string }) => {
  return (
    <div className="w-8 h-8 flex items-center justify-center bg-sub2 rounded-full overflow-hidden">
      {imgUrl === "" ? (
        <FaUser />
      ) : (
        <Image
          src={imgUrl}
          alt="User Avatar"
          width={30}
          height={30}
          className="rounded-full"
        />
      )}
    </div>
  );
};

export default UserProfile;
