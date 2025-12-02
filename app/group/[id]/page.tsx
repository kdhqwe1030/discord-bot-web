import { redirect } from "next/navigation";

interface EachGroupPageProps {
  params: Promise<{ id: string }>;
}

const eachGroupPage = async ({ params }: EachGroupPageProps) => {
  const { id: groupId } = await params;

  // 기본적으로 polls 탭으로 리다이렉트
  redirect(`/group/${groupId}/polls`);
};

export default eachGroupPage;
