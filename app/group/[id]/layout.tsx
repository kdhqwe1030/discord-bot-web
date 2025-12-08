import { createClient } from "@/lib/supabase/supabaseServer";
import { redirect } from "next/navigation";
import SideBar from "@/components/groups/section/SideBar";

interface GroupLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

const GroupLayout = async ({ children, params }: GroupLayoutProps) => {
  const { id: groupId } = await params;
  const supabase = await createClient();
  // 1. 현재 로그인 유저 확인
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // 2. 그룹 기본 정보 조회
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    return (
      <div className="min-h-screen flex items-center justify-center text-error">
        그룹을 찾을 수 없습니다.
      </div>
    );
  }

  // 3. 현재 유저가 이 그룹의 멤버인지 확인
  const { data: membership, error: memberError } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (memberError || !membership) {
    return (
      <div className="min-h-screen flex items-center justify-center text-error">
        이 그룹에 접근 권한이 없습니다.
      </div>
    );
  }


  return (
    <div className="min-h-screen flex bg-background text-foreground ">
      {/* 그룹 Summary 영역 */}
      <div className="w-full px-4 py-6 flex flex-row gap-6 lg:max-w-6xl lg:mx-auto">
        <SideBar group={group} groupId={groupId} />
        {/* 메인 영역 */}
        <section className="max-w-3/4 min-w-3/4 flex flex-col gap-6 ">
          {children}
        </section>
      </div>
    </div>
  );
};

export default GroupLayout;
