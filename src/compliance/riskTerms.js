import riskTerms from "../../data/risk-terms.json";

export const highRiskWords = riskTerms.highRiskWords || [];
export const evidenceRequiredWords = riskTerms.evidenceRequiredWords || [];
export const suggestedReplacements = riskTerms.suggestedReplacements || {};

export const privacyPatterns = [
  { label: "疑似手机号", regex: /1[3-9]\d{9}/g },
  { label: "疑似身份证号", regex: /\d{17}[\dXx]/g },
  { label: "疑似邮箱", regex: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g },
  { label: "疑似宿舍号", regex: /(宿舍|寝室|栋|楼|房间|门牌).{0,8}\d{2,4}/g }
];
