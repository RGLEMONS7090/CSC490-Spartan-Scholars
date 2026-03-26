import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { createAiFlashcardQuiz, createAiTestQuiz } from "../../assets/js/api/quizApi";

export default function QuizAiGenerator() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activityType, setActivityType] = useState("test");
  const [form, setForm] = useState({
    mainTopic: "",
    classLevel: "",
    topicsToCover: "",
    itemCount: 5,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const noteState = location.state;
    if (!noteState?.sourceNoteContent) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      mainTopic: noteState.sourceNoteTitle || prev.mainTopic,
      classLevel: "",
      topicsToCover: [noteState.sourceNoteCategory, noteState.sourceNoteContent].filter(Boolean).join("\n\n") || prev.topicsToCover,
    }));
  }, [location.state]);

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleGenerate() {
    setSaving(true);
    setError("");
    try {
      const payload = {
        mainTopic: form.mainTopic,
        classLevel: form.classLevel,
        topicsToCover: form.topicsToCover,
        itemCount: Number(form.itemCount),
      };

      const quiz =
        activityType === "test"
          ? await createAiTestQuiz(payload)
          : await createAiFlashcardQuiz(payload);

      const path =
        activityType === "test"
          ? `/take-quizzes/${quiz.id}`
          : `/take-quizzes/${quiz.id}/flashcards`;
      navigate(path);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>Create Quiz with AI</title>
      </Helmet>

      <main className="main main--quizzes">
        <section className="quizzesHeader">
          <div className="quizzesHeader__title">
            <div className="quizzesHeader__icon">AI</div>
            <div>
              <h1>Create Quiz with AI</h1>
              <p>Tell Spartan Scholars AI what to cover and it will build a test quiz or flashcard deck for you.</p>
            </div>
          </div>
          <div className="quizEditorActions">
            <Link className="quizActionBtn quizActionBtn--secondary" to="/take-quizzes/create">
              Back
            </Link>
            <button className="quizActionBtn quizActionBtn--primary" type="button" onClick={handleGenerate} disabled={saving}>
              {saving ? "Generating..." : activityType === "test" ? "Generate Test Quiz" : "Generate Flashcards"}
            </button>
          </div>
        </section>

        <section className="quizEditorPanel">
          {location.state?.sourceNoteTitle && (
            <p className="quizNotice">
              Using note: <strong>{location.state.sourceNoteTitle}</strong>
            </p>
          )}

          <div className="quizTypeToggle">
            <button
              type="button"
              className={`quizTypeToggle__button ${activityType === "test" ? "quizTypeToggle__button--active" : ""}`}
              onClick={() => setActivityType("test")}
            >
              Test Quiz
            </button>
            <button
              type="button"
              className={`quizTypeToggle__button ${activityType === "flashcards" ? "quizTypeToggle__button--active" : ""}`}
              onClick={() => setActivityType("flashcards")}
            >
              Flashcard Quiz
            </button>
          </div>

          <div className="quizOptionGrid">
            <label className="quizField">
              <span>What is the main topic?</span>
              <input
                value={form.mainTopic}
                onChange={(e) => updateField("mainTopic", e.target.value)}
                placeholder="Ex: Cellular respiration"
              />
            </label>

            <label className="quizField">
              <span>What is the class level?</span>
              <input
                value={form.classLevel}
                onChange={(e) => updateField("classLevel", e.target.value)}
                placeholder="Ex: High school biology, AP Chem, Intro CS"
              />
            </label>
          </div>

          <label className="quizField">
            <span>Topics you want covered</span>
            <textarea
              value={form.topicsToCover}
              onChange={(e) => updateField("topicsToCover", e.target.value)}
              placeholder="List the subtopics, terms, or units you want the AI to cover."
            />
          </label>

          <label className="quizField quizField--compact">
            <span>How many {activityType === "test" ? "questions" : "flashcards"} do you want?</span>
            <input
              type="number"
              min="1"
              max="20"
              value={form.itemCount}
              onChange={(e) => updateField("itemCount", e.target.value)}
            />
          </label>

          {error && <p className="quizError">{error}</p>}
        </section>
      </main>
    </>
  );
}
