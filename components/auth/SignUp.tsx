import { ChangeEvent, useState } from "react";
import { IoArrowBackOutline } from "react-icons/io5";
import { authAPI } from "@/lib/api/auth";

const SignUp = ({ changeMode }: { changeMode: () => void }) => {
  // 유효성 검사 상태
  const [validations, setValidations] = useState({
    email: true,
    name: true,
    password: true,
    passwordCheck: true,
  });

  const [joinForm, setJoinForm] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
  });

  const [passwordCheck, setPasswordCheck] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 폼 제출
  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsLoading(true);

    // 모든 필드 유효성 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/;
    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

    // 모든 필드 검사 (비어있는 필드도 포함)
    const newValidations = {
      email: joinForm.email.trim() !== "" && emailRegex.test(joinForm.email),
      name: joinForm.name.trim() !== "",
      password:
        joinForm.password !== "" && passwordRegex.test(joinForm.password),
      passwordCheck:
        passwordCheck !== "" && joinForm.password === passwordCheck,
    };

    // 모든 검사 결과 적용
    setValidations(newValidations);
    const isAllValid = Object.values(newValidations).every((value) => value);

    if (isAllValid) {
      const { data, error } = await authAPI.register({
        email: joinForm.email,
        password: joinForm.password,
        username: joinForm.name,
      });

      if (error) {
        console.error("회원가입 실패", error);
        alert(error);
        setIsLoading(false);
        return;
      }

      console.log("회원가입 성공", data);
      alert("회원가입이 완료되었습니다! 이메일 인증 후 로그인해주세요.");
      changeMode(); // 로그인 페이지로 이동
    }

    setIsLoading(false);
  };

  // 입력값 변경 핸들러
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;

    // 비밀번호 확인 필드 처리
    if (id === "passwordCheck") {
      setPasswordCheck(value);
      setValidations({
        ...validations,
        passwordCheck: value === joinForm.password || value === "",
      });
      return;
    }

    // 폼 데이터 업데이트
    setJoinForm({
      ...joinForm,
      [id]: value,
    });

    // 사용자가 입력하는 동안은 유효성 검사 메시지 숨김
    setValidations({
      ...validations,
      [id]: true,
    });
  };

  // onBlur 처리 - 필드를 벗어날 때 유효성 검사
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { id, value } = e.target;

    // 값이 비어있으면 유효성 검사 스킵
    if (!value.trim()) return;

    // 필드별 유효성 검사
    switch (id) {
      case "email": {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        setValidations({
          ...validations,
          email: emailRegex.test(value),
        });
        break;
      }

      case "name": {
        setValidations({
          ...validations,
          name: value.trim().length > 0,
        });
        break;
      }

      case "password": {
        const passwordRegex =
          /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
        setValidations({
          ...validations,
          password: passwordRegex.test(value),
          // 비밀번호 변경시 비밀번호 확인 필드 유효성도 업데이트
          passwordCheck: passwordCheck === value || passwordCheck === "",
        });
        break;
      }

      case "passwordCheck": {
        setValidations({
          ...validations,
          passwordCheck: value === joinForm.password,
        });
        break;
      }
    }
  };

  return (
    <div className="p-8 w-100">
      {/* 뒤로가기 버튼 */}
      <div className="flex flex-col mb-4">
        <div
          onClick={changeMode}
          className="flex items-center bg-none border-none cursor-pointer text-foreground/60 text-sm p-1 transition-colors duration-200 hover:text-main self-start"
        >
          <IoArrowBackOutline />
          <span className="font-medium">로그인으로 돌아가기</span>
        </div>
      </div>

      <div className="w-full">
        {/* 이메일 */}
        <div className="mb-3">
          <label
            htmlFor="email"
            className="block text-foreground text-sm font-medium mb-2"
          >
            이메일
          </label>
          <input
            id="email"
            type="email"
            placeholder="m@example.com"
            autoComplete="email"
            value={joinForm.email}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full p-3 border-2 rounded-md text-sm transition-all duration-200 bg-background text-foreground focus:outline-none placeholder:text-foreground/40 ${
              !validations.email
                ? "border-red-500 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]"
                : "border-foreground/20 focus:border-main focus:shadow-[0_0_0_3px] focus:shadow-main/10"
            }`}
            required
          />
          <div className="h-1 mt-1">
            {!validations.email && (
              <p className="text-red-500 text-xs mt-1 font-medium transition-all duration-200">
                {joinForm.email.trim() === ""
                  ? "이메일을 입력해주세요."
                  : "유효한 이메일 주소를 입력해주세요."}
              </p>
            )}
          </div>
        </div>

        {/* 이름 */}
        <div className="mb-3">
          <label
            htmlFor="name"
            className="block text-foreground text-sm font-medium mb-2"
          >
            이름
          </label>
          <input
            id="name"
            type="text"
            placeholder="홍길동"
            autoComplete="name"
            value={joinForm.name}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full p-3 border-2 rounded-md text-sm transition-all duration-200 bg-background text-foreground focus:outline-none placeholder:text-foreground/40 ${
              !validations.name
                ? "border-red-500 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]"
                : "border-foreground/20 focus:border-main focus:shadow-[0_0_0_3px] focus:shadow-main/10"
            }`}
            required
          />
          <div className="h-1 mt-1">
            {!validations.name && (
              <p className="text-red-500 text-xs mt-1 font-medium">
                이름을 입력해주세요.
              </p>
            )}
          </div>
        </div>

        {/* 비밀번호 */}
        <div className="mb-3">
          <label
            htmlFor="password"
            className="block text-foreground text-sm font-medium mb-2"
          >
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={joinForm.password}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full p-3 border-2 rounded-md text-sm transition-all duration-200 bg-background text-foreground focus:outline-none placeholder:text-foreground/40 ${
              !validations.password
                ? "border-red-500 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]"
                : "border-foreground/20 focus:border-main focus:shadow-[0_0_0_3px] focus:shadow-main/10"
            }`}
            required
          />
          <div className="h-1 mt-1">
            {!validations.password && (
              <p className="text-red-500 text-xs font-medium">
                {joinForm.password === ""
                  ? "비밀번호를 입력해주세요."
                  : "비밀번호는 8자 이상, 영문자, 숫자, 특수문자를 포함해야 합니다."}
              </p>
            )}
          </div>
        </div>

        {/* 비밀번호 확인 */}
        <div className="mb-3">
          <label
            htmlFor="passwordCheck"
            className="block text-foreground text-sm font-medium mb-2"
          >
            비밀번호 확인
          </label>
          <input
            id="passwordCheck"
            type="password"
            autoComplete="new-password"
            value={passwordCheck}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full p-3 border-2 rounded-md text-sm transition-all duration-200 bg-background text-foreground focus:outline-none placeholder:text-foreground/40 ${
              !validations.passwordCheck
                ? "border-red-500 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]"
                : "border-foreground/20 focus:border-main focus:shadow-[0_0_0_3px] focus:shadow-main/10"
            }`}
            required
          />
          <div className="h-1 mt-1">
            {!validations.passwordCheck && (
              <p className="text-red-500 text-xs mt-1 font-medium">
                {passwordCheck === ""
                  ? "비밀번호 확인을 입력해주세요."
                  : "비밀번호가 일치하지 않습니다."}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full p-3 bg-main text-white border-none rounded-md text-sm font-bold cursor-pointer transition-all duration-200 mt-4 hover:bg-main/80 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "가입 중..." : "회원가입"}
        </button>
      </div>
    </div>
  );
};

export default SignUp;
