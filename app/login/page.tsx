"use client";

export default function LoginPage() {
  const handleDiscordLogin = () => {
    window.location.href = "/api/auth/discord/link";
  };

  return (
    <main className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-8">Discord 로그인 테스트</h1>
      <button
        onClick={handleDiscordLogin}
        className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-lg text-lg font-semibold shadow-lg"
      >
        🔑 Discord로 로그인
      </button>
    </main>
  );
}
