import MatchWrapper from "@/components/matches/MatchWrapper";

interface CustomMatchesPageProps {
  params: Promise<{ id: string }>;
}

const CustomMatchesPage = async ({ params }: CustomMatchesPageProps) => {
  const { id: groupId } = await params;

  return (
    <div>
      <h2 className="text-xl font-semibold text-text-1 mb-4">사용자 설정</h2>
      <MatchWrapper groupId={groupId} type="custom" />
    </div>
  );
};

export default CustomMatchesPage;
