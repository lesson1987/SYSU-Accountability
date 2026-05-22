import "./style.css";
import { copyText } from "./actions/copyText.js";
import { downloadText } from "./actions/downloadText.js";
import { openMailDraft } from "./actions/openMailDraft.js";
import { checkText } from "./compliance/checkText.js";
import { loadRepoData } from "./data/loadRepoData.js";
import { generateLetter } from "./generator/generateLetter.js";

const app = document.querySelector("#app");
const fixedCaseId = "dorm-relocation";

const materialTypes = [
  { id: "report-letter", label: "举报/情况反映" },
  { id: "appeal-letter", label: "申诉材料" },
  { id: "disclosure-request", label: "信息公开申请" }
];

let repoData;
let generatedText = "";
let warnings = [];

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getSelectedValues(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map((item) => item.value);
}

function getSelectedCaseId() {
  return fixedCaseId;
}

function getSelectedTarget() {
  const targetId =
    document.querySelector('input[name="target"]:checked')?.value || repoData.targets[0]?.id || "";

  if (targetId === "custom") {
    return {
      id: "custom",
      name: document.querySelector("#customRecipientName").value.trim() || "自定义收件人",
      recipientLabel:
        document.querySelector("#customRecipientName").value.trim() || "自定义收件人",
      email: document.querySelector("#customRecipientEmail").value.trim(),
      recommendedTemplate: document.querySelector("#materialType").value
    };
  }

  return repoData.targets.find((item) => item.id === targetId) || repoData.targets[0];
}

function getSelectedTemplateId() {
  return document.querySelector("#materialType")?.value || getSelectedTarget()?.recommendedTemplate || "report-letter";
}

function getUserInput() {
  return {
    senderName: document.querySelector("#senderName").value.trim(),
    senderContact: document.querySelector("#senderContact").value.trim(),
    customImpact: document.querySelector("#customImpact").value.trim(),
    extraNote: document.querySelector("#extraNote").value.trim()
  };
}

function renderCheckboxGroup({ title, hint, name, items, getText }) {
  const body = items.length
    ? items
        .map(
          (item) => `
            <label class="check-row">
              <input type="checkbox" name="${name}" value="${escapeHtml(item.id)}" />
              <span>
                <strong>${escapeHtml(item.title || item.text || item.name)}</strong>
                <small>${escapeHtml(getText(item))}</small>
              </span>
            </label>
          `
        )
        .join("")
    : `<p class="empty-note">当前暂无结构化条目，后续可继续补充具体事实材料。</p>`;

  return `
    <section class="field-block">
      <div class="section-title">
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(hint)}</p>
      </div>
      <div class="check-list">${body}</div>
    </section>
  `;
}

function renderTargetList(targets) {
  const rows = targets
    .map(
      (item, index) => `
        <label class="target-row">
          <input
            type="radio"
            name="target"
            value="${escapeHtml(item.id)}"
            ${index === 0 ? "checked" : ""}
          />
          <span>
            <strong>${escapeHtml(item.name)}</strong>
            <small><b>${escapeHtml(item.type)}</b> · ${escapeHtml(item.description)}</small>
          </span>
        </label>
      `
    )
    .join("");

  return `
    <section class="field-block">
      <div class="section-title">
        <h2>反映对象</h2>
        <p>先列出可考虑的对象类型；具体公开渠道、邮箱或网页后续补充和核验。</p>
      </div>
      <div class="target-list">
        ${rows}
        <label class="target-row">
          <input type="radio" name="target" value="custom" />
          <span>
            <strong>自定义收件人</strong>
            <small><b>手动填写</b> · 用于后续补充公开、正式、可核验的具体渠道。</small>
          </span>
        </label>
      </div>
    </section>
  `;
}

function renderWarningList(items) {
  if (!items.length) {
    return `
      <div class="result-state ok">
        <strong>未发现明显高风险表达。</strong>
        <span>仍需人工核对事实、证据、措辞、个人信息和附件脱敏情况。</span>
      </div>
    `;
  }

  return `
    <ul class="warning-list">
      ${items
        .map(
          (item) => `
            <li class="${escapeHtml(item.level)}">
              <strong>${item.level === "high" ? "高风险" : "需核对"}</strong>
              <span>${escapeHtml(item.message)}</span>
            </li>
          `
        )
        .join("")}
    </ul>
  `;
}

function renderStatus(message = "") {
  const status = document.querySelector("#statusMessage");
  if (status) {
    status.textContent = message;
  }
}

function buildCurrentLetter() {
  const caseId = getSelectedCaseId();
  const selectedFactIds = getSelectedValues("facts");
  const selectedEvidenceIds = getSelectedValues("evidence");
  const selectedDemandIds = getSelectedValues("demands");
  const templateId = getSelectedTemplateId();
  const caseInfo = repoData.cases.find((item) => item.id === caseId);
  const selectedFacts = repoData.facts.filter((item) => selectedFactIds.includes(item.id));
  const selectedEvidence = repoData.evidence.filter((item) => selectedEvidenceIds.includes(item.id));
  const selectedDemands = repoData.demands.filter((item) => selectedDemandIds.includes(item.id));

  return generateLetter({
    template: repoData.templates[templateId] || repoData.templates["report-letter"],
    caseInfo,
    target: getSelectedTarget(),
    selectedFacts,
    selectedEvidence,
    selectedDemands,
    userInput: getUserInput()
  });
}

function refreshPreview() {
  const preview = document.querySelector("#letterPreview");
  const compliance = document.querySelector("#complianceResult");

  if (preview) {
    preview.textContent =
      generatedText || "请选择事实、证据和诉求后点击“生成材料”。生成内容仅保存在当前浏览器页面中。";
  }

  if (compliance) {
    compliance.innerHTML = renderWarningList(warnings);
  }
}

function updateCustomRecipientVisibility() {
  const customFields = document.querySelector("#customRecipientFields");
  const selectedTarget = document.querySelector('input[name="target"]:checked')?.value;

  if (customFields) {
    customFields.hidden = selectedTarget !== "custom";
  }
}

function attachEvents() {
  document.querySelectorAll('input[name="target"]').forEach((input) => {
    input.addEventListener("change", updateCustomRecipientVisibility);
  });
  updateCustomRecipientVisibility();

  document.querySelector("#generateBtn").addEventListener("click", () => {
    generatedText = buildCurrentLetter();
    warnings = [];
    refreshPreview();
    renderStatus("已生成草稿。提交前请逐项核对事实、证据、措辞和个人信息。");
  });

  document.querySelector("#checkBtn").addEventListener("click", () => {
    const text = generatedText || buildCurrentLetter();
    generatedText = text;
    warnings = checkText(text);
    refreshPreview();
    renderStatus(warnings.length ? "合规检查完成，请处理提示项。" : "合规检查完成，未发现明显高风险表达。");
  });

  document.querySelector("#copyBtn").addEventListener("click", async () => {
    const text = generatedText || buildCurrentLetter();
    generatedText = text;
    await copyText(text);
    refreshPreview();
    renderStatus("正文已复制。粘贴或提交前仍需人工核对。");
  });

  document.querySelector("#downloadBtn").addEventListener("click", () => {
    const text = generatedText || buildCurrentLetter();
    const caseInfo = repoData.cases.find((item) => item.id === getSelectedCaseId());
    const filename = `${caseInfo?.title || "情况反映"}-材料草稿.md`;
    generatedText = text;
    downloadText(filename, text);
    refreshPreview();
    renderStatus("Markdown 草稿已下载。");
  });

  document.querySelector("#mailBtn").addEventListener("click", () => {
    const text = generatedText || buildCurrentLetter();
    const caseInfo = repoData.cases.find((item) => item.id === getSelectedCaseId());
    generatedText = text;
    refreshPreview();
    renderStatus("正在打开邮件草稿。请在邮件客户端中自行审阅后再决定是否发送。");
    openMailDraft({
      to: getSelectedTarget()?.email || "",
      subject: `关于${caseInfo?.title || "相关事项"}的情况反映材料`,
      body: text
    });
  });
}

function renderApp() {
  const selectedCaseId = getSelectedCaseId();
  const caseInfo = repoData.cases.find((item) => item.id === selectedCaseId) || repoData.cases[0];
  const materialOptions = materialTypes
    .map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</option>`)
    .join("");
  const facts = repoData.facts.filter((item) => item.caseId === selectedCaseId);
  const demands = repoData.demands.filter((item) => item.caseId === selectedCaseId);

  app.innerHTML = `
    <div class="app-shell">
      <header class="hero">
        <div>
          <p class="eyebrow">SYSU Student Voice</p>
          <h1>举报/反映材料生成器</h1>
          <p class="subtitle">聚焦宿舍调整事项，基于公开材料和个人经历生成正式文本。真实、克制、合规、理性表达。</p>
        </div>
        <div class="hero-notice">
          <strong>本地处理</strong>
          <span>不自动发送，不保存用户填写内容，不上传个人输入。</span>
        </div>
      </header>

      <main class="workspace">
        <form class="panel form-panel" onsubmit="return false;">
          <section class="field-grid top-controls">
            <div class="scenario-card">
              <span>当前主题</span>
              <strong>${escapeHtml(caseInfo?.title || "宿舍调整")}</strong>
              <p>${escapeHtml(caseInfo?.description || "与宿舍调整、搬迁安排、过渡期、特殊困难处理机制相关的问题。")}</p>
            </div>
            <label>
              <span>材料类型</span>
              <select id="materialType">${materialOptions}</select>
            </label>
          </section>

          ${renderTargetList(repoData.targets)}

          <section id="customRecipientFields" class="custom-fields" hidden>
            <label>
              <span>自定义收件人名称</span>
              <input id="customRecipientName" type="text" placeholder="例如：相关负责老师/部门" />
            </label>
            <label>
              <span>收件邮箱</span>
              <input id="customRecipientEmail" type="email" placeholder="仅用于打开邮件草稿，可留空" />
            </label>
          </section>

          ${renderCheckboxGroup({
            title: "事实选择",
            hint: "具体事实材料后续补充；当前示例仅用于验证生成流程。",
            name: "facts",
            items: facts,
            getText: (item) => `${item.date} · ${item.safeWording || item.content}`
          })}

          ${renderCheckboxGroup({
            title: "证据选择",
            hint: "材料情况暂时保持当前结构；所有附件和截图应先脱敏。",
            name: "evidence",
            items: repoData.evidence,
            getText: (item) => `${item.type} · ${item.description}`
          })}

          ${renderCheckboxGroup({
            title: "诉求选择",
            hint: "具体诉求后续可继续补充，优先保留程序性、可执行表述。",
            name: "demands",
            items: demands,
            getText: (item) => item.text
          })}

          <section class="field-block">
            <div class="section-title">
              <h2>用户填写</h2>
              <p>姓名和联系方式允许留空。请避免填写他人隐私。</p>
            </div>
            <div class="field-grid">
              <label>
                <span>反映人姓名</span>
                <input id="senderName" type="text" placeholder="可留空" />
              </label>
              <label>
                <span>联系方式</span>
                <input id="senderContact" type="text" placeholder="可留空" />
              </label>
            </div>
            <label>
              <span>个人受到的具体影响</span>
              <textarea id="customImpact" rows="4" placeholder="请使用第一人称、事实性描述，避免夸大和定性。"></textarea>
            </label>
            <label>
              <span>补充说明</span>
              <textarea id="extraNote" rows="4" placeholder="可补充时间、沟通过程、希望核实的问题等。"></textarea>
            </label>
          </section>

          <section class="actions">
            <button id="generateBtn" type="button" class="primary">生成材料</button>
            <button id="checkBtn" type="button">合规检查</button>
            <button id="copyBtn" type="button">复制正文</button>
            <button id="downloadBtn" type="button">下载 Markdown</button>
            <button id="mailBtn" type="button">打开邮件草稿</button>
          </section>
          <p id="statusMessage" class="status" role="status"></p>
        </form>

        <aside class="panel preview-panel">
          <section>
            <div class="section-title">
              <h2>生成结果预览</h2>
              <p>该草稿不会自动发送，提交前必须人工审阅。</p>
            </div>
            <pre id="letterPreview" class="letter-preview"></pre>
          </section>

          <section>
            <div class="section-title">
              <h2>合规检查结果</h2>
              <p>检查高风险定性词、需证据支撑表达和疑似个人信息。</p>
            </div>
            <div id="complianceResult"></div>
          </section>

          <section class="risk-card">
            <h2>风险提示</h2>
            <ul>
              <li>仅使用真实经历、公开材料或已脱敏证据。</li>
              <li>不要公开他人姓名、联系方式、证件号、人脸、车牌、宿舍号等信息。</li>
              <li>不要冒名署名，不代表未经授权的其他同学。</li>
              <li>邮件草稿打开后仍需用户自行审阅并决定是否发送。</li>
            </ul>
          </section>
        </aside>
      </main>

      <footer>
        本工具生成的是举报/反映材料草稿，不自动发送。用户应在提交前自行核对事实、证据、措辞和个人信息，并对提交内容负责。本工具不鼓励捏造事实、侮辱诽谤、公开隐私、冒名署名或批量骚扰。
      </footer>
    </div>
  `;

  refreshPreview();
  attachEvents();
}

async function init() {
  repoData = await loadRepoData();
  renderApp();
}

init().catch((error) => {
  app.innerHTML = `
    <main class="load-error">
      <h1>数据加载失败</h1>
      <p>${escapeHtml(error.message)}</p>
    </main>
  `;
});
