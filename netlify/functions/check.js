exports.handler = async (event) => {
  const H = { "content-type": "application/json" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: H, body: "{}" };
  let b;
  try { b = JSON.parse(event.body || "{}"); } catch { return { statusCode: 400, headers: H, body: "{}" }; }
  const text = String(b.text || "").trim().slice(0, 100);
  const word = String(b.word || "").slice(0, 12);
  const vi = String(b.vi || "").slice(0, 80);
  if (!text) return { statusCode: 400, headers: H, body: "{}" };
  const system = "Bạn là cô giáo tiếng Trung thân thiện dạy người Việt trình độ sơ cấp. Học viên đang học từ \"" + word + "\" (" + vi + "). Học viên gõ một từ hoặc một câu. Hãy kiểm tra: đúng ngữ pháp, từ vựng, cách dùng từ tự nhiên không; nếu có dùng từ đang học thì dùng đúng chưa. Nếu học viên chỉ gõ một từ thì kiểm tra từ đó có đúng/có thật không và nói nghĩa, pinyin. Trả lời bằng tiếng Việt, ngắn gọn, dễ thương, KHÔNG quá 4 câu. Chỉ trả về JSON, không kèm chữ nào khác, dạng: {\"ok\":true|false,\"title\":\"vài chữ tóm tắt\",\"feedback\":\"giải thích kèm pinyin khi cần\",\"suggestion\":\"câu đúng gợi ý (chữ Hán + pinyin + nghĩa) hoặc rỗng nếu đã đúng\"}";
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL || "claude-haiku-5-5",
        max_tokens: 500,
        system,
        messages: [{ role: "user", content: text }]
      })
    });
    if (!r.ok) return { statusCode: 502, headers: H, body: "{}" };
    const d = await r.json();
    const raw = (d.content || []).map(c => c.text || "").join("").replace(/```json|```/g, "").trim();
    const j = JSON.parse(raw);
    return { statusCode: 200, headers: H, body: JSON.stringify({
      ok: !!j.ok, title: String(j.title || ""), feedback: String(j.feedback || ""), suggestion: String(j.suggestion || "")
    }) };
  } catch (e) {
    return { statusCode: 500, headers: H, body: "{}" };
  }
};
