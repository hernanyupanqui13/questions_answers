// Small utility to generate short random room IDs like "abc-123"
export function nanoid(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const segment = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${segment(3)}-${segment(4)}`;
}
