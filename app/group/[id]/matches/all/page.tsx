interface AllMatchesPageProps {
  params: Promise<{ id: string }>;
}

const AllMatchesPage = async ({ params }: AllMatchesPageProps) => {
  const { id: groupId } = await params;

  return (
    <div>
      <h2 className="text-xl font-semibold text-text-1 mb-4">전체 매치</h2>
      <p className="text-text-3">그룹 {groupId}의 모든 매치 기록이 여기에 표시됩니다.</p>
    </div>
  );
};

export default AllMatchesPage;
