import { Link } from "react-router-dom";
import {useState} from "react";
import useTheme from "../assets/js/useTheme";
import {logout} from "../assets/js/utils/logout";
import {Helmet} from "react-helmet-async";

export default function AiAssistant() {

  return (
    <>
      <Helmet>
        <title> AI Assistant </title>
      </Helmet>

        <main className="main main--assistant">
          <section className="assistantHeader">
            <div className="assistantHeader__icon">AI</div>
            <div>
              <h1>AI Study Assistant</h1>
              <p>Ask questions and get instant help</p>
            </div>
          </section>

          <section className="assistantNotice">
            <span className="assistantNotice__icon">i</span>
            <span>This is an experimental version, answers may not be correct</span>
          </section>

          <section className="assistantPanel">
            <div className="assistantPanel__scroll">
              <div className="assistantEmpty">
                <div className="assistantEmpty__badge">AI</div>
                <h2>Start a conversation</h2>
                <p>
                  Ask me anything about your studies! I can help with homework
                  questions, explain concepts, or suggest study strategies.
                </p>

                <div className="assistantSuggestions">
                  <button type="button" className="assistantSuggestion">
                    How do I calculate Big O notation?
                  </button>
                  <button type="button" className="assistantSuggestion">
                    Explain photosynthesis in simple terms
                  </button>
                  <button type="button" className="assistantSuggestion">
                    What's the best way to study for exams?
                  </button>
                  <button type="button" className="assistantSuggestion">
                    Help me understand calculus derivatives
                  </button>
                </div>
              </div>
            </div>

            <div className="assistantComposer">
              <div
                className="assistantComposer__input"
                aria-label="Ask me anything about your studies"
              >
                <span className="assistantComposer__placeholder">
                  Ask me anything about your studies...
                </span>

                <button
                  type="button"
                  className="assistantComposer__send"
                  aria-label="Send message"
                >
                  &gt;
                </button>
              </div>

              <p className="assistantComposer__hint">
                Press Enter to send, Shift + Enter for new line
              </p>
            </div>
          </section>
        </main>
    </>
  );
}