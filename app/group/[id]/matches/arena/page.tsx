interface ArenaMatchesPageProps {
  params: Promise<{ id: string }>;
}

const ArenaMatchesPage = async ({ params }: ArenaMatchesPageProps) => {
  const { id: groupId } = await params;

  return (
    <div>
      <h2 className="text-xl font-semibold text-text-1 mb-4">아수라장</h2>
      <p className="text-text-3">그룹 {groupId}의 아수라장 매치 기록이 여기에 표시됩니다.</p>
    </div>
  );
};

export default ArenaMatchesPage;
