"use client";

import { PASSWORD_RULES } from "@/lib/password";

export default function PasswordChecklist({ password = "" }) {
  return (
    <ul className="pw-checklist">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(password);
        return (
          <li key={rule.id} className={ok ? "ok" : ""}>
            {ok ? "✓" : "○"} {rule.label}
          </li>
        );
      })}
    </ul>
  );
}