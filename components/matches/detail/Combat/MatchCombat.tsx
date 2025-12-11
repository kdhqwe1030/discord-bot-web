import { GiCrossedSwords } from "react-icons/gi";

const MatchCombat = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="p-4 bg-slate-800 rounded-full mb-4">
        <GiCrossedSwords className="w-10 h-10 text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-text-1 mb-2">
        교전 정밀 분석 기능 준비 중
      </h3>
      <p className="text-sm text-text-3 text-center max-w-md leading-relaxed">
        한타 화력 집중도, 스킬 교환비, 포지셔닝 히트맵 등<br />
        <strong>"그 한타, 누가 캐리하고 누가 범인인가?"</strong>를<br />
        확인할 수 있는 기능을 열심히 개발하고 있습니다!
      </p>
    </div>
  );
};

export default MatchCombat;
