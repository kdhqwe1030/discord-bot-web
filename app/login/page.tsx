"use client";

import SignIn from "@/components/auth/SignIn";
import SignUp from "@/components/auth/SignUp";

import { useState } from "react";
export default function LoginPage() {
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
