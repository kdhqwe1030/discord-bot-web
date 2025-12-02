import PollList from "@/components/groups/section/PollList";
import Link from "next/link";

interface PollsPageProps {
  params: Promise<{ id: string }>;
}

const PollsPage = async ({ params }: PollsPageProps) => {
  const { id: groupId } = await params;

  return (
    <section className="flex flex-col flex-1">
      {/* 탭 헤더 */}
      <div className="border-b border-divider flex gap-6 px-4 py-2 text-md font-medium">
        <Link
          href={`/group/${groupId}/matches/all`}
          className="text-text-2 hover:text-text-1 pb-2"
        >
          매치
        </Link>
        <Link
          href={`/group/${groupId}/polls`}
          className="text-primary border-b-2 border-primary pb-2"
        >
          투표
        </Link>
      </div>

      {/* 투표 목록 */}
      <PollList groupId={groupId} />
    </section>
  );
};

export default PollsPage;
