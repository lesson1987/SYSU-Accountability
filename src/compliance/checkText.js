import {
  evidenceRequiredWords,
  highRiskWords,
  privacyPatterns,
  suggestedReplacements
} from "./riskTerms.js";

export function checkText(text) {
  const warnings = [];

  for (const word of highRiskWords) {
    if (text.includes(word)) {
      const replacement = suggestedReplacements[word]
        ? `可考虑改为“${suggestedReplacements[word]}”。`
        : "建议改为事实描述或程序性表述。";

      warnings.push({
        level: "high",
        type: "risky-word",
        message: `包含高风险定性词“${word}”，${replacement}`
      });
    }
  }

  for (const word of evidenceRequiredWords) {
    if (text.includes(word)) {
      warnings.push({
        level: "medium",
        type: "evidence-required",
        message: `“${word}”需要证据支撑，建议附来源或改为更谨慎表述。`
      });
    }
  }

  for (const item of privacyPatterns) {
    const matches = text.match(item.regex);
    if (matches?.length) {
      warnings.push({
        level: "high",
        type: "privacy",
        message: `${item.label}：${[...new Set(matches)].join("、")}，建议脱敏。`
      });
    }
  }

  return warnings;
}
