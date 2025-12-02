// components/auth/SignIn.tsx
"use client";

import { ChangeEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaDiscord } from "react-icons/fa";
import { authAPI } from "@/lib/api/auth";

const SignIn = ({ changeMode }: { changeMode: () => void }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ?next=/invite/xxx 없으면 기본 "/"
  const next = searchParams.get("next") || "/group";

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setLoginForm((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = async (
    e:
      | React.MouseEvent<HTMLButtonElement>
      | React.KeyboardEvent<HTMLInputElement>
  ) => {
    e.preventDefault();
    setIsLoading(true);

    const { data, error } = await authAPI.login(loginForm);

    if (error) {
      console.error("로그인 실패", error);
      alert(error);
      setIsLoading(false);
      return;
    }

    console.log("로그인 성공", data);
    // next 파라미터로 돌아가기
    router.push(next);
  };

  const handleDiscordLogin = () => {
    //디스코드 OAuth 라우트에 next 같이 보내기
    const encodedNext = encodeURIComponent(next);
    window.location.href = `/api/auth/discord/login?next=${encodedNext}`;
  };

  return (
    <div className="p-8 w-100">
      <div className="w-full">
        <div className="mb-6">
          <label
            htmlFor="email"
            className="block text-foreground text-sm font-medium mb-2 mt-2"
          >
            이메일
          </label>
          <input
            id="email"
            type="email"
            placeholder="m@example.com"
            autoComplete="email"
            value={loginForm.email}
            onChange={handleChange}
            className="w-full p-3 border-2 border-foreground/20 rounded-md text-sm transition-all duration-200 bg-background text-foreground focus:border-primary focus:outline-none focus:shadow-[0_0_0_3px] focus:shadow-main/10 placeholder:text-foreground/40"
            required
          />
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center">
            <label
              htmlFor="password"
              className="block text-foreground text-sm font-medium mb-2"
            >
              비밀번호
            </label>
            <a
              href="#"
              className="text-primary-light text-xs no-underline inline-block transition-colors duration-200 mb-2 hover:underline"
            >
              비밀번호를 잊으셨나요?
            </a>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={loginForm.password}
            onChange={handleChange}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") handleSubmit(e);
            }}
            className="w-full p-3 border-2 border-foreground/20 rounded-md text-sm transition-all duration-200 bg-background text-foreground focus:border-primary focus:outline-none focus:shadow-[0_0_0_3px] focus:shadow-main/10 placeholder:text-foreground/40"
            required
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full p-3 bg-primary text-text-1  border-none rounded-md text-sm font-bold cursor-pointer transition-all duration-200 mt-2 hover:bg-main/80 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "로그인 중..." : "로그인"}
        </button>
      </div>

      {/* 디스코드 소셜 로그인 */}
      <div className="flex items-center text-center my-6">
        <div className="flex-1 border-b border-foreground/20"></div>
        <span className="px-4 text-foreground/50 text-xs">
          Or continue with
        </span>
        <div className="flex-1 border-b border-foreground/20"></div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          className="relative w-full p-3 bg-discord text-text-1  rounded-md text-sm font-medium cursor-pointer transition-all duration-200 flex items-center justify-center gap-3 hover:bg-discord/80 active:scale-[1.02]"
          onClick={handleDiscordLogin}
        >
          <FaDiscord className="w-5 h-5" />
          Discord로 로그인
        </button>
      </div>

      <div className="text-center mt-6 text-foreground/60 text-xs">
        계정이 필요하신가요?
        <button
          onClick={changeMode}
          className="text-primary-light font-bold no-underline ml-2 bg-none border-none cursor-pointer hover:underline"
        >
          가입하기
        </button>
      </div>
    </div>
  );
};

export default SignIn;
