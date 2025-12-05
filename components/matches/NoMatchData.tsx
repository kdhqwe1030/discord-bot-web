import { IoIosInformationCircleOutline } from "react-icons/io";

const NoMatchData = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <IoIosInformationCircleOutline className="w-16 h-16 text-text-3 mb-4" />
      <h3 className="text-lg font-semibold text-text-1 mb-2">
        전적 데이터가 없습니다
      </h3>
      <p className="text-sm text-text-3 text-center">
        아직 기록된 게임 전적이 없습니다.
        <br />
        게임을 플레이한 후 전적을 갱신해보세요.
      </p>
    </div>
  );
};

export default NoMatchData;
