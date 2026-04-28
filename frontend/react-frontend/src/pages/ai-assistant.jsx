import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { sendAiChat } from "../assets/js/api/aiApi";

const starterSuggestions = [
  "How do I calculate Big O notation?",
  "Explain photosynthesis in simple terms",
  "What's the best way to study for finals?",
  "Help me understand calculus derivatives",
];

export default function AiAssistant() {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function submitMessage(rawText) {
    const message = rawText.trim();
    if (!message || sending) {
      return;
    }

    const nextMessages = [...messages, { role: "user", content: message }];
    setMessages(nextMessages);
    setDraft("");
    setError("");
    setSending(true);

    try {
      const data = await sendAiChat(message, messages);
      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setMessages(messages);
      setDraft(message);
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    submitMessage(draft);
  }

  function handleSuggestionClick(suggestion) {
    submitMessage(suggestion);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitMessage(draft);
    }
  }

  return (
    <>
      <Helmet>
        <title>AI Assistant</title>
      </Helmet>

      <main className="main main--assistant">
        <section className="assistantHeader">
          <div className="assistantHeader__icon">AI</div>
          <div>
            <h1>AI Study Assistant</h1>
            <p>Ask school-related questions and get study-focused help.</p>
          </div>
        </section>

        <section className="assistantNotice">
          <span className="assistantNotice__icon">i</span>
          <span>This assistant is limited to school-related topics and study support.</span>
        </section>

        <section className="assistantPanel">
          <div className="assistantPanel__scroll">
            {messages.length === 0 ? (
              <div className="assistantEmpty">
                <div className="assistantEmpty__badge">AI</div>
                <h2>Start a conversation</h2>
                <p>
                  Ask about homework, class concepts, exam prep, academic writing, or study strategies.
                </p>

                <div className="assistantSuggestions">
                  {starterSuggestions.map((suggestion) => (
                    <button key={suggestion} type="button" className="assistantSuggestion" onClick={() => handleSuggestionClick(suggestion)}>
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="assistantMessages">
                {messages.map((message, index) => (
                  <article
                    key={`${message.role}-${index}`}
                    className={`assistantMessage assistantMessage--${message.role}`}
                  >
                    <div className="assistantMessage__label">{message.role === "user" ? "You" : "AI Study Assistant"}</div>
                    <p>{message.content}</p>
                  </article>
                ))}

                {sending && (
                  <article className="assistantMessage assistantMessage--assistant">
                    <div className="assistantMessage__label">AI Study Assistant</div>
                    <p>Thinking...</p>
                  </article>
                )}
              </div>
            )}
          </div>

          <form className="assistantComposer" onSubmit={handleSubmit}>
            <div className="assistantComposer__input">
              <textarea
                className="assistantComposer__textarea"
                aria-label="Ask me anything about your studies"
                placeholder="Ask me anything about your studies..."
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
              />

              <button
                type="submit"
                className="assistantComposer__send"
                aria-label="Send message"
                disabled={sending || !draft.trim()}
              >
                &gt;
              </button>
            </div>

            <p className="assistantComposer__hint">
              Press Enter to send, Shift + Enter for new line
            </p>

            {error && <p className="quizError">{error}</p>}
          </form>
        </section>
      </main>
    </>
  );
}
