export function getGameModeName({ queueId }: { queueId: number }): string {
  // 1. 사설 게임 체크 (queueId가 0이거나 gameType이 CUSTOM_GAME)

  // 2. 큐 ID 매핑
  switch (queueId) {
    case 0:
      return "사설";
    // case 420:
    //   return "솔로 랭크";
    case 440:
      return "자유 랭크";
    case 450:
      return "칼바람 나락";
    // case 490:
    //   return "빠른 대전"; // (구 일반)
    case 700:
    case 720:
      return "격전";
    default:
      return "이벤트 모드";
  }
}
