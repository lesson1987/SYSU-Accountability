export function buildEvidenceText(evidenceList) {
  if (!evidenceList.length) {
    return "暂无附件材料。建议补充通知截图、公开文件、网页链接或其他已脱敏材料。";
  }

  return evidenceList
    .map((item, index) => {
      const parts = [
        `${index + 1}. ${item.title}`,
        `材料编号：${item.id}`,
        `材料类型：${item.type}`,
        item.date ? `时间：${item.date}` : null,
        item.description ? `说明：${item.description}` : null,
        item.path ? `路径：${item.path}` : null
      ].filter(Boolean);

      return parts.join("；");
    })
    .join("\n");
}
