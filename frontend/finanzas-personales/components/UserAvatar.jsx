"use client";

import Avatar from "boring-avatars";

const AVATAR_COLORS = ["#1D4ED8", "#3B82F6", "#6366F1", "#0EA5E9", "#312E81"];

export default function UserAvatar({ name = "", lastName = "", email = "", size = 40 }) {
  const seed = email || `${name} ${lastName}`.trim() || "usuario";

  return (
    <Avatar
      name={seed}
      variant="beam"
      size={size}
      colors={AVATAR_COLORS}
    />
  );
}