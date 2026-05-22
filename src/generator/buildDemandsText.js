export function buildDemandsText(demands) {
  if (!demands.length) {
    return [
      "1. 请说明相关安排的制度依据、决策程序和执行标准。",
      "2. 请充分听取受影响学生意见，并设置合理反馈渠道。",
      "3. 请对特殊困难学生提供复核、暂缓或替代方案。",
      "4. 请以适当方式反馈处理意见。"
    ].join("\n");
  }

  return demands.map((item, index) => `${index + 1}. ${item.text}`).join("\n");
}
