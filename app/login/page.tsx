"use client";

import SignIn from "@/components/auth/SignIn";
import SignUp from "@/components/auth/SignUp";
import { Suspense, useState } from "react";

function LoginContent() {
  const [signMode, setSignMode] = useState(true);
  const changeMode = () => {
    setSignMode(!signMode);
  };

  return (
    <main className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
      {signMode ? (
        <SignIn changeMode={changeMode} />
      ) : (
        <SignUp changeMode={changeMode} />
      )}
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
          <div className="text-text-3 ">로딩 중...</div>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
