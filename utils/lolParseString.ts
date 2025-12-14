export function getObjectiveDisplayName(monsterType?: string): string {
  if (!monsterType) return "오브젝트";

  const type = monsterType.toLowerCase();

  if (type.includes("dragon")) return "드래곤";
  if (type.includes("herald")) return "전령";
  if (type.includes("horde")) return "공허 유충";
  if (type.includes("atakhan")) return "아타칸";
  if (type.includes("baron")) return "바론";

  return monsterType;
}
