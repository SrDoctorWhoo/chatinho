export function generateProtocol(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const randomStr = Math.floor(1000 + Math.random() * 9000).toString(); // 4 random digits
  return `${dateStr}-${randomStr}`;
}
