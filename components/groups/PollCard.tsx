import type { PollWithResults } from "@/types/poll";

const PollCard = ({ poll }: { poll: PollWithResults }) => {
  const isActive = poll.isActive;
  const totalVotes = poll.totalVotes;
  const created = new Date(poll.createdAt);
  const ended = new Date(poll.endTime);

  // 날짜만 비교 (연/월/일)
  const isSameDate =
    created.getFullYear() === ended.getFullYear() &&
    created.getMonth() === ended.getMonth() &&
    created.getDate() === ended.getDate();

  const startDate = created.toLocaleDateString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });

  const endDate = isSameDate
    ? ended.toLocaleTimeString("ko-KR", {
        hour: "numeric",
        minute: "numeric",
        hour12: false,
      })
    : ended.toLocaleDateString("ko-KR", {
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: false,
      });
  return (
    <div className="bg-surface-1 border border-border rounded-xl p-5 relative">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-text-1 font-semibold text-lg pr-24 line-clamp-2">
          {poll.title}
        </h3>
        <span
          className={`absolute top-5 right-5 px-3 py-1 rounded text-xs font-medium whitespace-nowrap ${
            isActive ? "bg-success-bg text-success" : "bg-error-bg text-error"
          }`}
        >
          {isActive ? "진행 중" : "투표 종료"}
        </span>
      </div>

      {/* 투표 옵션들 */}
      <div className="space-y-3 mb-4">
        {poll.options.map((option) => (
          <div key={option.id}>
            {/* 옵션명과 투표 수 */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-text-2">{option.label}</span>
              <span className="text-xs text-text-3">{option.voteCount}명</span>
            </div>

            {/* 프로그레스 바 */}
            <div className="relative w-full h-2 bg-surface-3 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all"
                style={{ width: `${option.percentage}%` }}
              />
            </div>

            {/* 투표한 사람들 이름 */}
            {option.voters.length > 0 && (
              <div className="flex items-center gap-1 mt-2 flex-wrap">
                {option.voters.slice(0, 5).map((voter, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-surface-3 text-text-2 text-xs rounded"
                    title={voter.userName}
                  >
                    {voter.userName.slice(0, 3)}
                  </span>
                ))}
                {option.voters.length > 5 && (
                  <span className="text-[10px] text-text-3">
                    +{option.voters.length - 5}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 총 투표 수 - 하단 고정 */}
      <div className="absolute bottom-3 left-5 right-5 text-xs text-text-4">
        <div className="flex justify-between items-center">
          <span>
            {startDate}
            {poll.endTime && (
              <>
                {"  ~  "}
                {endDate}
              </>
            )}
          </span>
          <span>총 {totalVotes}명</span>
        </div>
      </div>
    </div>
  );
};

export default PollCard;
