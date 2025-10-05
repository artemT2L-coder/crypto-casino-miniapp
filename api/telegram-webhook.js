/* eslint-disable */
module.exports = async (req, res) => {
  // Telegram шлёт POST; для GET отдаём 200 чтобы можно было проверить в браузере
  if (req.method !== "POST") return res.status(200).send("ok");

  // На Vercel body может прийти строкой
  const update = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const WEBAPP_URL =
    process.env.WEBAPP_URL || "https://crypto-casino-miniapp.vercel.app";

  const tg = async (method, payload) => {
    await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  };

  try {
    const msg = update?.message;
    const cq = update?.callback_query;

    if (msg?.text) {
      const chat_id = msg.chat.id;
      const text = String(msg.text).trim().toLowerCase();

      if (text === "/start" || text === "start") {
        // Сообщение с кнопкой «Открыть игру»
        await tg("sendMessage", {
          chat_id,
          text: "Запускай симулятор:",
          reply_markup: {
            inline_keyboard: [[{ text: "🎮 Открыть игру", web_app: { url: WEBAPP_URL } }]],
          },
        });

        // Кнопка в меню чата
        await tg("setChatMenuButton", {
          chat_id,
          menu_button: {
            type: "web_app",
            text: "Открыть игру",
            web_app: { url: WEBAPP_URL },
          },
        });
      } else {
        await tg("sendMessage", {
          chat_id,
          text: "Напиши /start — пришлю кнопку для запуска игры.",
        });
      }
    }

    if (cq?.id) {
      await tg("answerCallbackQuery", { callback_query_id: cq.id });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(200).json({ ok: true });
  }
};
