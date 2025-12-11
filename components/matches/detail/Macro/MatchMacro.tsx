import { GiChessKnight } from "react-icons/gi";

const MatchMacro = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="p-4 bg-slate-800 rounded-full mb-4">
        <GiChessKnight className="w-10 h-10 text-blue-400" />
      </div>
      <h3 className="text-lg font-semibold text-text-1 mb-2">
        운영/매크로 분석 기능 준비 중
      </h3>
      <p className="text-sm text-text-3 text-center max-w-md leading-relaxed">
        고립 데스(짤림), 인원 배분, 정글/서폿 커버 동선 등<br />
        <strong>"뇌지컬과 팀워크"</strong>를 분석할 수 있는
        <br />
        스마트한 지표들을 준비하고 있습니다! 🧠
      </p>
    </div>
  );
};

export default MatchMacro;
