exports.handler = async (event) => {
  const H = { "content-type": "application/json" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: H, body: "{}" };
  let b;
  try { b = JSON.parse(event.body || "{}"); } catch { return { statusCode: 400, headers: H, body: "{}" }; }
  const text = String(b.text || "").trim().slice(0, 100);
  if (!text) return { statusCode: 400, headers: H, body: "{}" };
  const fmt = " Trả lời bằng tiếng Việt, ngắn gọn, dễ thương, KHÔNG quá 4 câu. Chỉ trả về JSON, không kèm chữ nào khác, dạng: {\"ok\":true|false,\"title\":\"vài chữ tóm tắt\",\"feedback\":\"giải thích kèm pinyin khi cần\",\"suggestion\":\"câu đúng gợi ý (chữ Hán + pinyin + nghĩa) hoặc rỗng nếu đã đúng\"}";
  let system;
  if (b.title) {
    const t = String(b.title).slice(0, 60), f = String(b.formula || "").slice(0, 120), e = String(b.explain || "").slice(0, 400);
    system = "Bạn là cô giáo tiếng Trung thân thiện dạy người Việt trình độ sơ cấp. Học viên đang luyện điểm ngữ pháp \"" + t + "\" với công thức \"" + f + "\" (" + e + "). Học viên gõ một câu. Hãy kiểm tra câu có ĐÚNG ngữ pháp không và có dùng ĐÚNG công thức này không (ok=false nếu sai ngữ pháp hoặc không dùng mẫu này)." + fmt;
  } else {
    const w = String(b.word || "").slice(0, 12), v = String(b.vi || "").slice(0, 80);
    system = "Bạn là cô giáo tiếng Trung thân thiện dạy người Việt trình độ sơ cấp. Học viên đang học từ \"" + w + "\" (" + v + "). Học viên gõ một từ hoặc một câu. Hãy kiểm tra ngữ pháp, từ vựng, cách dùng có tự nhiên không; nếu có dùng từ đang học thì dùng đúng chưa. Nếu chỉ gõ một từ thì kiểm tra từ đó có đúng không và nói nghĩa, pinyin." + fmt;
  }
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: process.env.CLAUDE_MODEL || "claude-haiku-5-5", max_tokens: 500, system, messages: [{ role: "user", content: text }] })
    });
    if (!r.ok) return { statusCode: 502, headers: H, body: "{}" };
    const d = await r.json();
    const j = JSON.parse((d.content || []).map(c => c.text || "").join("").replace(/```json|```/g, "").trim());
    return { statusCode: 200, headers: H, body: JSON.stringify({ ok: !!j.ok, title: String(j.title || ""), feedback: String(j.feedback || ""), suggestion: String(j.suggestion || "") }) };
  } catch (e) {
    return { statusCode: 500, headers: H, body: "{}" };
  }
};
