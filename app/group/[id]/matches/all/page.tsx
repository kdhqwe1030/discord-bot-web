import MatchWrapper from "@/components/matches/MatchWrapper";

interface AllMatchesPageProps {
  params: Promise<{ id: string }>;
}

const AllMatchesPage = async ({ params }: AllMatchesPageProps) => {
  const { id: groupId } = await params;

  return (
    <div>
      <h2 className="text-xl font-semibold text-text-1 mb-4">전체 매치</h2>
      <MatchWrapper groupId={groupId} type="all" />
    </div>
  );
};

export default AllMatchesPage;
