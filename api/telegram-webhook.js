/* eslint-env node */
/* global process */

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).send("ok");

  const update = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const WEBAPP_URL = process.env.WEBAPP_URL || "https://crypto-casino-miniapp.vercel.app";

  const tg = async (method, payload) => {
    await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  };

  try {
    const msg = update?.message;
    const cq  = update?.callback_query;

    if (msg?.text) {
      const text = String(msg.text).trim().toLowerCase();
      const chat_id = msg.chat.id;

      if (text === "/start" || text === "start") {
        await tg("sendMessage", {
          chat_id,
          text: "Запускай симулятор:",
          reply_markup: {
            inline_keyboard: [[
              { text: "🎮 Открыть игру", web_app: { url: WEBAPP_URL } }
            ]]
          }
        });

        await tg("setChatMenuButton", {
          chat_id,
          menu_button: { type: "web_app", text: "Открыть игру", web_app: { url: WEBAPP_URL } }
        });
      } else {
        await tg("sendMessage", {
          chat_id,
          text: "Напиши /start — пришлю кнопку для запуска игры."
        });
      }
    }

    if (cq) {
      const chat_id = cq.message?.chat?.id;
      if (chat_id) {
        await tg("answerCallbackQuery", { callback_query_id: cq.id });
        await tg("sendMessage", { chat_id, text: "Колбэк получен ✅" });
      }
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(200).json({ ok: true });
  }
}
