import { Link } from "react-router-dom";
import {useState} from "react";
import useTheme from "../assets/js/useTheme";
import {logout} from "../assets/js/utils/logout";
import {Helmet} from "react-helmet-async";


export default function StudyGroups() {
  
  return (
    <>
      <Helmet>
        <title> Study Groups </title>
      </Helmet>

        <main className="main main--groups">
          <section className="groupsHeader">
            <div className="groupsHeader__title">
              <div className="groupsHeader__icon">G</div>
              <div>
                <h1>Study Groups</h1>
                <p>Join collaborative study groups and learn together</p>
              </div>
            </div>

            <button type="button" className="groupsHeader__button">
              + Create Group
            </button>
          </section>

          <section className="groupsGrid">
            {/* Group 1 */}
            <article className="groupCard">
              <div className="groupCard__top">
                <span className="groupCard__dot groupCard__dot--blue" />
                <span className="groupCard__tag">Computer Science</span>
              </div>

              <h2>Computer Science Fundamentals</h2>

              <p className="groupCard__text">
                Learn algorithms, data structures, and programming concepts together
              </p>

              <div className="groupCard__meta">
                <span>234</span>
                <span>2 hours ago</span>
              </div>

              <button type="button" className="groupCard__button">
                Join Group
              </button>
            </article>

            {/* Group 2 */}
            <article className="groupCard">
              <div className="groupCard__top">
                <span className="groupCard__dot groupCard__dot--red" />
                <span className="groupCard__tag">Anatomy</span>
              </div>

              <h2>Human Anatomy Study Circle</h2>

              <p className="groupCard__text">
                Collaborative learning for anatomy and physiology
              </p>

              <div className="groupCard__meta">
                <span>189</span>
                <span>5 hours ago</span>
              </div>

              <button type="button" className="groupCard__button">
                Join Group
              </button>
            </article>

            {/* Group 3 */}
            <article className="groupCard">
              <div className="groupCard__top">
                <span className="groupCard__dot groupCard__dot--green" />
                <span className="groupCard__tag">Chemistry</span>
              </div>

              <h2>Chemistry Lab Partners</h2>

              <p className="groupCard__text">
                Discuss reactions, molecular structures, and lab work
              </p>

              <div className="groupCard__meta">
                <span>156</span>
                <span>1 day ago</span>
              </div>

              <button type="button" className="groupCard__button">
                Join Group
              </button>
            </article>

            {/* Group 4 */}
            <article className="groupCard">
              <div className="groupCard__top">
                <span className="groupCard__dot groupCard__dot--purple" />
                <span className="groupCard__tag">Mathematics</span>
              </div>

              <h2>Mathematics Mastery</h2>

              <p className="groupCard__text">
                Calculus, algebra, and advanced math problem solving
              </p>

              <div className="groupCard__meta">
                <span>312</span>
                <span>3 hours ago</span>
              </div>

              <button type="button" className="groupCard__button">
                Join Group
              </button>
            </article>

            {/* Group 5 */}
            <article className="groupCard">
              <div className="groupCard__top">
                <span className="groupCard__dot groupCard__dot--indigo" />
                <span className="groupCard__tag">Physics</span>
              </div>

              <h2>Physics Problem Solvers</h2>

              <p className="groupCard__text">
                Work through physics concepts and challenging problems
              </p>

              <div className="groupCard__meta">
                <span>198</span>
                <span>6 hours ago</span>
              </div>

              <button type="button" className="groupCard__button">
                Join Group
              </button>
            </article>

            {/* Group 6 */}
            <article className="groupCard">
              <div className="groupCard__top">
                <span className="groupCard__dot groupCard__dot--teal" />
                <span className="groupCard__tag">Biology</span>
              </div>

              <h2>Biology Concepts Exchange</h2>

              <p className="groupCard__text">
                Review genetics, cell biology, and exam preparation together
              </p>

              <div className="groupCard__meta">
                <span>276</span>
                <span>4 hours ago</span>
              </div>

              <button type="button" className="groupCard__button">
                Join Group
              </button>
            </article>
          </section>
        </main>
    </>
  );
}