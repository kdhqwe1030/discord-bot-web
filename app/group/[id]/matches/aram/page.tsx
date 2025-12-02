interface AramMatchesPageProps {
  params: Promise<{ id: string }>;
}

const AramMatchesPage = async ({ params }: AramMatchesPageProps) => {
  const { id: groupId } = await params;

  return (
    <div>
      <h2 className="text-xl font-semibold text-text-1 mb-4">칼바람</h2>
      <p className="text-text-3">그룹 {groupId}의 칼바람 나락 매치 기록이 여기에 표시됩니다.</p>
    </div>
  );
};

export default AramMatchesPage;
