const RIOT_API_KEY = process.env.RIOT_API_KEY!;
export async function fetchWithRetry(url: string, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, {
      headers: { "X-Riot-Token": RIOT_API_KEY },
    });

    // 429 에러(요청 제한 초과) 발생 시
    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After");
      // 라이엇이 알려준 대기시간(초) * 1000, 없으면 기본 1초 대기
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : delay;

      console.warn(`Rate limit hit. Waiting ${waitTime}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      continue; // 루프를 다시 돌아서 재요청
    }

    return res; // 성공(200)하거나 다른 에러면 반환
  }
  throw new Error("Max retries exceeded");
}
