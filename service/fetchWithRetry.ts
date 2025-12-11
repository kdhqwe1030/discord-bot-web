const RIOT_API_KEY = process.env.RIOT_API_KEY!;

export async function fetchWithRetry(url: string, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, {
      headers: { "X-Riot-Token": RIOT_API_KEY },
    });

    if (res.status === 429) {
      // 1. 라이엇이 대기 시간을 알려주면 무조건 그걸 따름 (가장 정확)
      const retryAfter = res.headers.get("Retry-After");
      const waitTime = retryAfter
        ? parseInt(retryAfter) * 1000
        : delay * Math.pow(2, i); // 2. 헤더가 없으면 '지수 백오프' 적용

      console.warn(
        `[429] Rate limit hit. Retry ${
          i + 1
        }/${retries}. Waiting ${waitTime}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, waitTime));
      continue;
    }

    return res;
  }
  throw new Error("Max retries exceeded");
}
