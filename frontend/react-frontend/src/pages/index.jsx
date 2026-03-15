import { Link } from "react-router-dom";
import {useState} from "react";
import useTheme from "../assets/js/useTheme";
import {logout} from "../assets/js/utils/logout";
import {Helmet} from "react-helmet-async";

export default function Index() {
  
  return (
    <>
      <Helmet>
        <title> Dashboard </title>
      </Helmet>

        <main className="main">
          <section className="hero">
            <h1>Welcome to Spartan Scholars</h1>
            <p>Your all-in-one study platform for notes, discussions, and AI-powered learning.</p>
          </section>

          <section className="section">
            <div className="row g-4">
              {/* Notes & Summaries */}
              <div className="col-12 col-md-6 col-xl-4">
                <article className="featureCard h-100">
                  <div className="featureCard__iconWrap">
                    <span className="featureCard__icon">N</span>
                  </div>
                  <h2>Notes &amp; Summaries</h2>
                  <p>Create and organize study notes with fast search and tagging.</p>
                  <ul className="bullets">
                    <li><span className="dot dot--green"></span>Save Your Notes</li>
                    <li><span className="dot dot--blue"></span>Text Editor</li>
                    <li><span className="dot dot--blue"></span>Categories &amp; Tags</li>
                  </ul>
                  <Link className="primaryBtn primaryBtn--link" to="/notes-summaries">
                    Get Started <span className="arrow">→</span>
                  </Link>
                </article>
              </div>

              {/* Discussion Board */}
              <div className="col-12 col-md-6 col-xl-4">
                <article className="featureCard h-100">
                  <div className="featureCard__iconWrap featureCard__iconWrap--purple">
                    <span className="featureCard__icon">D</span>
                  </div>
                  <h2>Discussion Board</h2>
                  <p>Join communities, ask questions, and collaborate with peers.</p>
                  <ul className="bullets">
                    <li><span className="dot dot--green"></span>Active Communities</li>
                    <li><span className="dot dot--blue"></span>Topic Threads</li>
                    <li><span className="dot dot--blue"></span>Peer Support</li>
                  </ul>
                  <Link className="primaryBtn primaryBtn--link" to="/discussion-board">
                    Get Started <span className="arrow">→</span>
                  </Link>
                </article>
              </div>

              {/* AI Summarizer */}
              <div className="col-12 col-md-6 col-xl-4">
                <article className="featureCard h-100">
                  <div className="featureCard__iconWrap featureCard__iconWrap--gold">
                    <span className="featureCard__icon">*</span>
                  </div>
                  <h2>AI Note Summarizer</h2>
                  <p>Turn notes into summaries, flashcards, and key points in seconds.</p>
                  <ul className="bullets">
                    <li><span className="dot dot--green"></span>Auto Summaries</li>
                    <li><span className="dot dot--blue"></span>Flashcard Generation</li>
                    <li><span className="dot dot--blue"></span>Key Concept Extraction</li>
                  </ul>
                  <Link className="primaryBtn primaryBtn--link" to="/ai-assistant">
                    Get Started <span className="arrow">→</span>
                  </Link>
                </article>
              </div>

            </div>
          </section>
        </main>
      
    </>
  );
}