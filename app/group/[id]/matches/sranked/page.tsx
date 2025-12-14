import MatchWrapper from "@/components/matches/MatchWrapper";

interface RankedMatchesPageProps {
  params: Promise<{ id: string }>;
}

const RankedMatchesPage = async ({ params }: RankedMatchesPageProps) => {
  const { id: groupId } = await params;

  return (
    <div>
      <h2 className="text-xl font-semibold text-text-1 mb-4">솔로랭크</h2>
      <MatchWrapper groupId={groupId} type="solo_ranked" />
    </div>
  );
};

export default RankedMatchesPage;
