interface Requirement {
  label: string;
  test: (pw: string) => boolean;
}

const REQUIREMENTS: Requirement[] = [
  { label: "At least 10 characters", test: (pw) => pw.length >= 10 },
  { label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "One digit", test: (pw) => /[0-9]/.test(pw) },
];

const LEVELS = [
  { label: "TOO WEAK", color: "bg-signal" },
  { label: "WEAK", color: "bg-signal" },
  { label: "GETTING THERE", color: "bg-jade/50" },
  { label: "STRONG", color: "bg-jade" },
];

export function PasswordStrengthMeter({ password }: { password: string }) {
  const passed = REQUIREMENTS.filter((r) => r.test(password)).length;
  const level = password.length === 0 ? 0 : passed;

  return (
    <div className="mt-2">
      <div className="flex gap-1.5 mb-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i < level ? LEVELS[level]!.color : "bg-hairline"
            }`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {REQUIREMENTS.map((r) => {
          const ok = r.test(password);
          return (
            <span
              key={r.label}
              className={`text-[10px] font-mono flex items-center gap-1 transition-colors ${
                ok ? "text-jade" : "text-muted"
              }`}
            >
              <span>{ok ? "✓" : "○"}</span>
              {r.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
