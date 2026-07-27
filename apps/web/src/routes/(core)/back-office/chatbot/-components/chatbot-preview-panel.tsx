import { useState } from "react";
import { SendHorizontal } from "lucide-react";
import { getBotResponse } from "@/utils/chatbot-utils";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";

export function ChatbotPreviewPanel() {
  const [messages, setMessages] = useState<{ id: string; sender: "user" | "bot"; text: string }[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const { data: kbData } = useQuery(trpc.platform.chatbot.getAll.queryOptions());
  const { data: waSetting } = useQuery(trpc.platform.setting.getByKey.queryOptions({ key: "chatbot_wa_number" }));

  const askMutation = useMutation(trpc.platform.chatbot.ask.mutationOptions());

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userText = inputText.trim();
    setMessages((prev) => [...prev, { id: `msg-${Date.now()}`, sender: "user", text: userText }]);
    setInputText("");
    setIsTyping(true);

    const history = messages.map((m) => ({
      role: (m.sender === "user" ? "user" : "model") as "user" | "model",
      text: m.text,
    }));

    askMutation.mutate(
      {
        message: userText,
        history,
      },
      {
        onSuccess: (data: { text: string }) => {
          setMessages((prev) => [...prev, { id: `msg-${Date.now() + 1}`, sender: "bot", text: data.text }]);
          setIsTyping(false);
        },
        onError: () => {
          const responseText = getBotResponse(userText, kbData ?? [], waSetting?.value);
          setMessages((prev) => [...prev, { id: `msg-${Date.now() + 1}`, sender: "bot", text: responseText }]);
          setIsTyping(false);
        },
      }
    );
  };

  return (
    <div className="flex h-[400px] flex-col rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
          <span className="text-xl">🤖</span>
        </div>
        <div>
          <h3 className="font-semibold leading-none">Test Reply (Preview)</h3>
          <p className="text-xs text-muted-foreground mt-1">Uji coba knowledge base Asty</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground mt-10">
            Ketik pesan di bawah untuk menguji respons chatbot.
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-slate-100 text-slate-800 rounded-bl-none dark:bg-slate-800 dark:text-slate-200"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-bl-none bg-slate-100 px-4 py-3 dark:bg-slate-800">
              <div className="flex gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0.4s" }}></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="border-t border-slate-100 p-3 flex gap-2 dark:border-slate-800">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ketik pesan ujian..."
          className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isTyping}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          <SendHorizontal className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
