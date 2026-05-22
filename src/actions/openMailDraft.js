export function openMailDraft({ to, subject, body }) {
  const cleanTo = encodeURIComponent(to || "");
  const cleanSubject = encodeURIComponent(subject || "情况反映材料");
  const cleanBody = encodeURIComponent(body || "");

  const url = `mailto:${cleanTo}?subject=${cleanSubject}&body=${cleanBody}`;

  if (url.length > 1800) {
    navigator.clipboard?.writeText(body);
    alert("正文较长，已复制到剪贴板。请在邮件草稿中手动粘贴，并仔细核对后发送。");
    window.location.href = `mailto:${cleanTo}?subject=${cleanSubject}`;
    return;
  }

  window.location.href = url;
}
