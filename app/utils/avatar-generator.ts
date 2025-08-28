export type AvatarStyle = "dicebear";

export function generateAvatar(seed: string): string {
  return `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(seed)}&backgroundColor=ff0048`;
}
