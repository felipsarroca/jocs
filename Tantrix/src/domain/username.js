export function normalizeName(value) {
  return String(value ?? "").normalize("NFKC").trim().replace(/\s+/gu, " ").toLocaleLowerCase("ca");
}

export function validateName(value) {
  const rawName = String(value ?? "").normalize("NFKC");
  if (/[\p{Cc}\p{Cf}\r\n]/u.test(rawName)) return { valid: false, message: "Aquest nom conté caràcters no admesos." };
  const displayName = rawName.trim().replace(/\s+/gu, " ");
  if (displayName.length < 2 || displayName.length > 24) return { valid: false, message: "Escriu entre 2 i 24 caràcters." };
  if (/^[=+\-@]/u.test(displayName)) {
    return { valid: false, message: "Aquest nom conté caràcters no admesos." };
  }
  if (!/^[\p{L}\p{M}\p{N} ._-]+$/u.test(displayName)) {
    return { valid: false, message: "Utilitza lletres, números, espais, punt, guió o guió baix." };
  }
  return { valid: true, displayName, normalizedName: normalizeName(displayName) };
}
