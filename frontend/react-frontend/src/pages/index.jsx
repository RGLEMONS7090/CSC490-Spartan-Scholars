import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import useTheme from "../assets/js/useTheme";

import notesIcon from "../assets/images/notes_icon.png";
import discussionIcon from "../assets/images/discussion_icon.png";
import aiIcon from "../assets/images/ai_icon.png";

const featureCards = [
  {
    icon: notesIcon,
    title: "Notes & Summaries",
    text: "Create, organize, and revisit your class notes in one place so studying starts with clean material.",
    link: "/notes",
  },
  {
    icon: discussionIcon,
    title: "Discussion Board",
    text: "Ask questions, reply to classmates, and keep course conversations moving without losing context.",
    link: "/discussion-board",
  },
  {
    icon: aiIcon,
    title: "AI Study Help",
    text: "Use AI to summarize notes, build quizzes, and turn rough material into something you can actually study from.",
    link: "/ai-assistant",
  },
];

export default function Index() {
  useTheme();

  return (
    <>
      <Helmet>
        <title>Dashboard</title>
      </Helmet>

      <main>
        <section className="hero">
          <h1>Welcome to Spartan Scholars</h1>
          <p>Your central workspace for notes, study groups, quizzes, and course momentum.</p>
        </section>

        <section className="section">
          <div className="grid grid-3">
            {featureCards.map((card, index) => (
              <article key={card.title} className="featureCard">
                <div
                  className={`featureCard__iconWrap ${
                    index === 1 ? "featureCard__iconWrap--purple" : index === 2 ? "featureCard__iconWrap--gold" : ""
                  }`}
                >
                  <img src={card.icon} alt="" />
                </div>
                <h2>{card.title}</h2>
                <p>{card.text}</p>
                <Link className="primaryBtn primaryBtn--link" to={card.link}>
                  Get Started
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
