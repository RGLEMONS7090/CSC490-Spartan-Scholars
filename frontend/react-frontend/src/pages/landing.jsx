import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import notesIcon from "../assets/images/notes_icon.png";
import discussionIcon from "../assets/images/discussion_icon.png";
import aiIcon from "../assets/images/ai_icon.png";
import logoLight from "../assets/images/logo_spartan_scholars.png";
import logoLightText from "../assets/images/text_logo.png";
import logoDark from "../assets/images/dark_mode_logo.png";
import logoDarkText from "../assets/images/dark_mode_text.png";

const proofItems = [
  { label: "Notes, quizzes, groups", value: "All-In-One" },
  { label: "Built for Students", value: "Not Boring" },
  { label: "Support through AI", value: "Instant" },
];

const featureCards = [
  {
    icon: notesIcon,
    title: "Capture everything without losing the thread",
    text: "Keep class notes, uploaded materials, and organized summaries in one workspace instead of having them scattered across tabs.",
  },
  {
    icon: aiIcon,
    title: "Quickly turn study material into action",
    text: "Generate flashcards, quizzes, and clear summaries from the content you already have to start studying faster.",
  },
  {
    icon: discussionIcon,
    title: "Study from shared material faster",
    text: "Browse public notes from other students, import what helps, and keep study groups focused on actual course work.",
  },
];

const steps = [
  "Create an account and drop in your notes or ideas.",
  "Build quizzes, flashcards, and a study plan from the same workspace.",
  "Join groups, browse public notes, and keep your work moving each week.",
];

const vibeTags = ["No More Tab Chaos", "Private Study Groups", "AI Study Support"];

export default function Landing() {
  return (
    <>
      <Helmet>
        <title>Spartan Scholars</title>
      </Helmet>

      <main className="landingPage">
        <header className="landingNav">
          <Link className="landingBrand" to="/welcome" aria-label="Spartan Scholars home">
            <span className="landingBrand__wordmark">
              <img className="landingBrand__text landingBrand__text--light" src={logoLightText} alt="Spartan Scholars" />
              <img className="landingBrand__text landingBrand__text--dark" src={logoDarkText} alt="Spartan Scholars" />
            </span>

            <span className="landingBrand__icon">
              <img className="landingBrand__logo landingBrand__logo--light" src={logoLight} alt="Spartan Scholars logo" />
              <img className="landingBrand__logo landingBrand__logo--dark" src={logoDark} alt="Spartan Scholars logo" />
            </span>
          </Link>

          <div className="landingNav__actions">
            <Link className="landingNav__link" to="/login">
              Log In
            </Link>
            <Link className="landingBtn landingBtn--primary" to="/signup">
              Sign Up
            </Link>
          </div>
        </header>

        <section className="landingHero">
          <div className="landingHero__copy">
            <span className="landingHero__eyebrow">Built for students who need structure, speed, and follow-through.</span>
            <div className="landingHero__tags">
              {vibeTags.map((tag) => (
                <span key={tag} className="landingHero__tagChip">
                  {tag}
                </span>
              ))}
            </div>

            <h1>
              Spartan Scholars makes
              <span className="landingHero__highlight"> your semester way less chaotic.</span>
            </h1>
            <p>
              Spartan Scholars puts your notes, quizzes, AI study help, planning, and group work in one place so you can stop
              academic panic-speedrunning every week.
            </p>

            <div className="landingHero__actions">
              <Link className="landingBtn landingBtn--primary" to="/signup">
                Create Your Account
              </Link>
              <Link className="landingBtn landingBtn--secondary" to="/login">
                Log In
              </Link>
            </div>

            <div className="landingProof">
              {proofItems.map((item) => (
                <article key={item.label} className="landingProof__item">
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </article>
              ))}
            </div>
          </div>

          <div className="landingHero__panel">
            <div className="landingMockup">
              <span className="landingMockup__sticker landingMockup__sticker--left">locked in</span>
              <span className="landingMockup__sticker landingMockup__sticker--right">study mode</span>

              <div className="landingMockup__top">
                <span className="landingMockup__pill">Study flow</span>
                <span className="landingMockup__status">Focused</span>
              </div>

              <div className="landingMockup__grid">
                <article className="landingMockup__card landingMockup__card--accent">
                  <span>Today</span>
                  <strong>Review BIO exam notes</strong>
                  <p>AI summary ready, quiz deck generated, task scheduled.</p>
                </article>

                <article className="landingMockup__card">
                  <span>Study Group</span>
                  <strong>CSC 490 Private Group</strong>
                  <p>New reply from your group and two shared quiz imports waiting.</p>
                </article>

                <article className="landingMockup__card">
                  <span>Notebook</span>
                  <strong>Uploaded lecture slides turned into flashcards</strong>
                </article>

                <article className="landingMockup__card">
                  <span>Productivity Hub</span>
                  <strong>3 tasks due this week</strong>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="landingSection">
          <div className="landingSection__intro">
            <span className="landingSection__tag">Why sign up</span>
            <h2>Built for the student who want to become more organized and collaborate with others this semester.</h2>
          </div>

          <div className="landingFeatureGrid">
            {featureCards.map((card) => (
              <article key={card.title} className="landingFeatureCard">
                <div className="landingFeatureCard__icon">
                  <img src={card.icon} alt="" />
                </div>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landingSection landingSection--split">
          <article className="landingStoryCard">
            <span className="landingSection__tag">What it feels like</span>
            <h2>Less Scrambling. More Studying with a Plan.</h2>
            <p>
              Instead of opening a notes app, a calendar app, a flashcard app, a public note feed, and an AI tab, you work from
              one system that contains everything you are already studying.
            </p>
          </article>

          <article className="landingStepsCard">
            <span className="landingSection__tag">How it works</span>
            <div className="landingSteps">
              {steps.map((step, index) => (
                <div key={step} className="landingSteps__item">
                  <span>{index + 1}</span>
                  <p>{step}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="landingCta">
          <div>
            <span className="landingSection__tag">Start now</span>
            <h2>Make this semester easier to manage before it gets harder to recover.</h2>
          </div>
          <div className="landingHero__actions">
            <Link className="landingBtn landingBtn--primary" to="/signup">
              Sign Up Free
            </Link>
            <Link className="landingBtn landingBtn--secondary" to="/login">
              Already Have an Account
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
