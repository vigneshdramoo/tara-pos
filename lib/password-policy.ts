export const MIN_PASSWORD_LENGTH = 10;

export type PasswordStrength = {
  label: "Weak" | "Fair" | "Strong";
  score: number;
  progressPercent: number;
  checks: Array<{
    label: string;
    passed: boolean;
  }>;
};

export function getPasswordStrength(password: string): PasswordStrength {
  const checks = [
    {
      label: `At least ${MIN_PASSWORD_LENGTH} characters`,
      passed: password.length >= MIN_PASSWORD_LENGTH,
    },
    {
      label: "Upper and lower case",
      passed: /[a-z]/.test(password) && /[A-Z]/.test(password),
    },
    {
      label: "At least one number",
      passed: /\d/.test(password),
    },
    {
      label: "At least one symbol",
      passed: /[^A-Za-z0-9]/.test(password),
    },
  ];

  const score = checks.filter((check) => check.passed).length;

  if (score <= 1) {
    return {
      label: "Weak",
      score,
      progressPercent: 25,
      checks,
    };
  }

  if (score <= 3) {
    return {
      label: "Fair",
      score,
      progressPercent: 65,
      checks,
    };
  }

  return {
    label: "Strong",
    score,
    progressPercent: 100,
    checks,
  };
}

export function validatePasswordStrength(password: string) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters for the new password.`;
  }

  return null;
}
