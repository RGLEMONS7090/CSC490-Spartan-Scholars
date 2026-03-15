import { Link } from "react-router-dom";
import {Helmet} from "react-helmet-async";

export default function TakeQuizzes() {
  return (
    <>
      <Helmet>
        <title> Quizzes </title>
      </Helmet>

        <main className="main main--quizzes">
          <section className="quizzesHeader">
            <div className="quizzesHeader__title">
              <div className="quizzesHeader__icon">Q</div>
              <div>
                <h1>Take Quizzes</h1>
                <p>Test your knowledge and track your progress</p>
              </div>
            </div>
          </section>

          <section className="quizStats">
            <article className="quizStatCard">
              <h2>Total Quizzes</h2>
              <div className="quizStatCard__value">6</div>
              <p>Available to take</p>
            </article>

            <article className="quizStatCard">
              <h2>Completed</h2>
              <div className="quizStatCard__value">3</div>
              <div className="quizStatCard__bar">
                <span />
              </div>
            </article>

            <article className="quizStatCard">
              <h2>Average Score</h2>
              <div className="quizStatCard__value">85%</div>
              <p>Keep up the good work!</p>
            </article>
          </section>

          <section className="quizGrid">
            {/* Quiz 1 */}
            <article className="quizCard">
              <div className="quizCard__top">
                <span className="quizCard__tag">Computer Science</span>
                <span className="quizCard__level quizCard__level--medium">
                  Medium
                </span>
              </div>

              <h2>Data Structures & Algorithms</h2>

              <p className="quizCard__meta">
                20 questions <span>•</span> 30 min
              </p>

              <button
                type="button"
                className="quizCard__button quizCard__button--primary"
              >
                Start Quiz
              </button>
            </article>

            {/* Quiz 2 */}
            <article className="quizCard">
              <div className="quizCard__top">
                <span className="quizCard__tag">Anatomy</span>
                <span className="quizCard__level quizCard__level--hard">Hard</span>
              </div>

              <h2>Human Anatomy Quiz</h2>

              <p className="quizCard__meta">
                15 questions <span>•</span> 20 min
              </p>

              <div className="quizCard__scoreRow">
                <span>Your Score:</span>
                <strong>85%</strong>
              </div>

              <button type="button" className="quizCard__button">
                Retake Quiz
              </button>
            </article>

            {/* Quiz 3 */}
            <article className="quizCard">
              <div className="quizCard__top">
                <span className="quizCard__tag">Chemistry</span>
                <span className="quizCard__level quizCard__level--easy">Easy</span>
              </div>

              <h2>Chemical Reactions</h2>

              <p className="quizCard__meta">
                25 questions <span>•</span> 35 min
              </p>

              <button
                type="button"
                className="quizCard__button quizCard__button--primary"
              >
                Start Quiz
              </button>
            </article>

            {/* Quiz 4 */}
            <article className="quizCard">
              <div className="quizCard__top">
                <span className="quizCard__tag">Mathematics</span>
                <span className="quizCard__level quizCard__level--medium">
                  Medium
                </span>
              </div>

              <h2>Calculus Fundamentals</h2>

              <p className="quizCard__meta">
                18 questions <span>•</span> 25 min
              </p>

              <div className="quizCard__scoreRow">
                <span>Your Score:</span>
                <strong>92%</strong>
              </div>

              <button type="button" className="quizCard__button">
                Retake Quiz
              </button>
            </article>
          </section>
        </main>
    </>
  );
}