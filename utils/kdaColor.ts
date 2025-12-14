export const kdaColor = (kda: number | string) => {
  if (kda === "Perfect") return "text-yellow-400";
  const numKda = Number(kda);
  if (numKda >= 5) return "text-purple-500";
  if (numKda >= 3) return "text-green-400";
  if (numKda >= 1) return "text-gray-200";
  return "text-text-4";
};
