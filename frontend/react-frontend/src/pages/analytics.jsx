import { Link } from "react-router-dom";
import {useState} from "react";
import useTheme from "../assets/js/useTheme";
import {logout} from "../assets/js/utils/logout";
import {Helmet} from "react-helmet-async";

export default function Analytics() {
  return(
    <>
      <Helmet>
        <title> Your Analytics </title>
      </Helmet>

    <main className="main main--quizzes">
      <section className="notesHeader">
        
        <div className="quizzesHeader__title">
          <div className="quizzesHeader__icon">A</div>
            <div>
              <h1>Learning Analytics</h1>
              <p>Upload quiz results, view performance trends, and track progress.</p>
            </div>
        </div>

        <div className="analyticsHeaderActions">
          <button type="button" className="quizCard__button analyticsHeaderActions__button">
            Filters
          </button>
          <button type="button" className="notesHeader__button">
            Export
          </button>
        </div>
      </section>

      <section className="quizStats analyticsStats">
        <article className="quizStatCard">
          <h2>Total Quizzes</h2>
          <div className="quizStatCard__value">12</div>
          <p>Across all subjects</p>
        </article>

        <article className="quizStatCard">
          <h2>Average Score</h2>
          <div className="quizStatCard__value">86%</div>
          <div className="quizStatCard__bar">
            <span style={{ width: "86%" }} />
          </div>
        </article>

        <article className="quizStatCard">
          <h2>Best Score</h2>
          <div className="quizStatCard__value">98%</div>
          <p>Latest high performance</p>
        </article>

        <article className="quizStatCard">
          <h2>Needs Review</h2>
          <div className="quizStatCard__value">2</div>
          <p>Priority topics this week</p>
        </article>
      </section>

      <section className="quizGrid analyticsPanels">
        <article className="quizCard">
          <div className="quizCard__top">
            <span className="quizCard__tag">Performance Trend</span>
            <span className="quizCard__level quizCard__level--medium">Weekly</span>
          </div>

          <h2>Score Trend</h2>
          <p className="quizCard__meta">
            Last 5 quiz attempts <span>•</span> Score %
          </p>

          <div className="analyticsChartWrap">
            <canvas id="scoreTrendChart" aria-label="Score trend line chart" />
          </div>
        </article>

        <article className="quizCard">
          <div className="quizCard__top">
            <span className="quizCard__tag">Data Import</span>
            <span className="quizCard__level quizCard__level--easy">CSV</span>
          </div>

          <h2>Upload Results</h2>
          <p className="quizCard__meta">Columns: student, quiz, score, date</p>

          <div className="analyticsUpload">
            <label htmlFor="csvFile" className="form-label">Choose file</label>
              <input
                type="file"
                className="form-control analyticsUpload__input"
                id="csvFile"
                accept=".csv"
              />

              <button
                type="button"
                className="quizCard__button quizCard__button--primary"
                id="uploadBtn">
                  Upload
              </button>

          </div>
        </article>
      </section>

      <section>
        <article className="quizCard">
          <div className="quizCard__top">
            <span className="quizCard__tag">Recent Activity</span>
            <span className="quizCard__level quizCard__level--easy">Updated</span>
          </div>

          <h2>Recent Quiz Results</h2>

            <div className="table-responsive">
              <table className="table align-middle analyticsTable">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Quiz</th>
                    <th>Score</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td>Aliyah</td>
                    <td>CSC 410 - Quiz 1</td>
                    <td>92%</td>
                    <td>03/01/2026</td>
                    <td>
                      <span className="analyticsStatus analyticsStatus--great">Great</span>
                    </td>
                  </tr>

                  <tr>
                    <td>Aliyah</td>
                    <td>CSC 350 - Quiz 2</td>
                    <td>78%</td>
                    <td>02/26/2026</td>
                    <td>
                      <span className="analyticsStatus analyticsStatus--review">Review</span>
                    </td>
                  </tr>

                  <tr>
                    <td>Aliyah</td>
                    <td>SQL - Joins</td>
                    <td>98%</td>
                    <td>02/20/2026</td>
                    <td>
                      <span className="analyticsStatus analyticsStatus--great">Great</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </main>
    </>
  );
}