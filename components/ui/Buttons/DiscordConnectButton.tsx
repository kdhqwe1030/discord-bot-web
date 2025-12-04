import { useSearchParams } from "next/navigation";
import { FaDiscord } from "react-icons/fa";

const DiscordConnectButton = () => {
  const searchParams = useSearchParams();

  // ?next=/invite/xxx 없으면 기본 "/"
  const next = searchParams.get("next") || "/group";
  const handleDiscordConnect = () => {
    //디스코드 OAuth 라우트에 next 같이 보내기
    const encodedNext = encodeURIComponent(next);
    window.location.href = `/api/auth/discord/connect?next=${encodedNext}`;
  };
  return (
    <button
      className="flex items-center gap-3 rounded-md bg-discord px-2 py-1 text-sm font-medium text-text-1 hover:bg-discord/80 transition-colors"
      onClick={handleDiscordConnect}
    >
      <FaDiscord className="w-4 h-4" />
      <span>Discord 연결</span>
    </button>
  );
};

export default DiscordConnectButton;
