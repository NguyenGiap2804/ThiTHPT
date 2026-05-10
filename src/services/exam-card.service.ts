export function getExamCodeBadgeLabel(examCode?: string | null) {
  const normalizedCode = examCode?.trim();
  return normalizedCode ? `Mã đề ${normalizedCode}` : null;
}
