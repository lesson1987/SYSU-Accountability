import { buildDemandsText } from "./buildDemandsText.js";
import { buildEvidenceText } from "./buildEvidenceText.js";
import { renderTemplate } from "./renderTemplate.js";

export function generateLetter({
  template,
  caseInfo,
  target,
  selectedFacts,
  selectedEvidence,
  selectedDemands,
  userInput
}) {
  const factsText = selectedFacts.length
    ? selectedFacts
        .map((fact, index) => `${index + 1}. ${fact.safeWording || fact.content}`)
        .join("\n")
    : "【请补充相关事实。建议只填写可核查、可说明来源的内容。】";

  const evidenceText = buildEvidenceText(selectedEvidence);
  const demandsText = buildDemandsText(selectedDemands);
  const problemsText = buildProblemsText(selectedFacts, userInput);

  return renderTemplate(template, {
    caseTitle: caseInfo?.title || "相关事项",
    targetName: target?.recipientLabel || target?.name || "相关部门",
    factsText,
    evidenceText,
    problemsText,
    demandsText,
    senderName: userInput.senderName || "【请填写】",
    senderContact: userInput.senderContact || "【可选填写】",
    date: userInput.date || new Date().toLocaleDateString("zh-CN")
  });
}

function buildProblemsText(selectedFacts, userInput) {
  const problems = [];

  if (selectedFacts.some((fact) => fact.id === "F001")) {
    problems.push("相关安排的制度依据、决策程序、适用范围和执行标准有待进一步说明。");
  }

  if (selectedFacts.some((fact) => fact.id === "F002")) {
    problems.push("部分学生反映搬迁期限较短，可能对科研、考试、实习或日常生活造成影响。");
  }

  if (selectedFacts.some((fact) => fact.id === "F003")) {
    problems.push("部分学生希望进一步了解复核渠道、特殊困难处理机制和反馈方式。");
  }

  if (userInput.customImpact) {
    problems.push(`本人受到的具体影响包括：${userInput.customImpact}`);
  }

  if (userInput.extraNote) {
    problems.push(`补充说明：${userInput.extraNote}`);
  }

  if (!problems.length) {
    problems.push("相关安排对学生学习、科研和生活的影响仍需进一步核查和沟通。");
  }

  return problems.map((item, index) => `${index + 1}. ${item}`).join("\n");
}
