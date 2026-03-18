import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { fetchProfile } from "../assets/js/api/profileApi";

const emptyStats = [
  {
    title: "Total Quizzes",
    value: "--",
    description: "No quiz data available yet.",
  },
  {
    title: "Average Score",
    value: "--",
    description: "Scores will appear after quiz results are recorded.",
  },
  {
    title: "Best Score",
    value: "--",
    description: "No completed attempts yet.",
  },
  {
    title: "Needs Review",
    value: "--",
    description: "Review topics will show up here later.",
  },
];

export default function Analytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCurrentUser() {
      try {
        await fetchProfile();
        setError("");
      } catch (err) {
        setError(err.message);
        if (err.message === "Your session has expired or you are not logged in.") {
          navigate("/login", { replace: true });
        }
      } finally {
        setLoading(false);
      }
    }

    loadCurrentUser();
  }, [navigate]);

  return (
    <>
      <Helmet>
        <title>Your Analytics</title>
      </Helmet>

      <main className="main main--quizzes">
        <section className="notesHeader">
          <div className="quizzesHeader__title">
            <div className="quizzesHeader__icon">A</div>
            <div>
              <h1>Learning Analytics</h1>
              <p>Your analytics will appear here once quiz activity is connected to your account.</p>
            </div>
          </div>
        </section>

        {loading ? (
          <p>Loading analytics...</p>
        ) : (
          <>
            <section className="quizStats analyticsStats">
              {emptyStats.map((stat) => (
                <article className="quizStatCard" key={stat.title}>
                  <h2>{stat.title}</h2>
                  <div className="quizStatCard__value">{stat.value}</div>
                  <p>{stat.description}</p>
                </article>
              ))}
            </section>

            <section className="quizGrid analyticsPanels">
              <article className="quizCard">
                <div className="quizCard__top">
                  <span className="quizCard__tag">Performance Trend</span>
                  <span className="quizCard__level quizCard__level--medium">Waiting for data</span>
                </div>

                <h2>Score Trend</h2>
                <p className="quizCard__meta">No quiz attempts have been recorded for this account yet.</p>

                <div className="analyticsChartWrap d-flex align-items-center justify-content-center">
                  <p className="text-center mb-0">No analytics to display.</p>
                </div>
              </article>

              <article className="quizCard">
                <div className="quizCard__top">
                  <span className="quizCard__tag">Recent Activity</span>
                  <span className="quizCard__level quizCard__level--easy">Empty</span>
                </div>

                <h2>Recent Quiz Results</h2>
                <p className="quizCard__meta">Results tied to the logged-in user will appear here.</p>
                <p className="mb-0">No quiz results available yet.</p>
              </article>
            </section>

            {error && <p className="quizError">{error}</p>}
          </>
        )}
      </main>
    </>
  );
}
