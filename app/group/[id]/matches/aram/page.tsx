import MatchWrapper from "@/components/matches/MatchWrapper";

interface AramMatchesPageProps {
  params: Promise<{ id: string }>;
}

const AramMatchesPage = async ({ params }: AramMatchesPageProps) => {
  const { id: groupId } = await params;

  return (
    <div>
      <h2 className="text-xl font-semibold text-text-1 mb-4">칼바람</h2>
      <MatchWrapper groupId={groupId} type="aram" />
    </div>
  );
};

export default AramMatchesPage;
