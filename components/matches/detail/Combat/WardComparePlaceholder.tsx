const WardComparePlaceholder = () => {
  return (
    <div className="h-full rounded-xl border border-slate-700 bg-slate-800/50 shadow-md px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-bold text-text-1">시야 비교</div>
        <div className="text-[10px] text-text-3">데이터 없음</div>
      </div>
      <div className="h-[calc(100%-2rem)] flex items-center justify-center text-xs text-text-3">
        이 이벤트에는 시야 데이터가 없습니다
      </div>
    </div>
  );
};
export default WardComparePlaceholder;
