import { Link } from "react-router-dom";
import {useState} from "react";
import useTheme from "../assets/js/useTheme";
import {logout} from "../assets/js/utils/logout";
import {Helmet} from "react-helmet-async";

export default function ExploreTopics() {
  
  return (
    <>
      <Helmet>
        <title> Explore Topics </title>
      </Helmet>
      
        <main className="main main--topics">
          <section className="topicsHeader">
            <div className="topicsHeader__titleRow">
              <div className="topicsHeader__icon">O</div>
              <div>
                <h1>Explore Topics</h1>
                <p>Discover new subjects and expand your knowledge</p>
              </div>
            </div>
          </section>

          <section className="topicsFilters">
            <button
              type="button"
              className="topicsFilters__chip topicsFilters__chip--active"
            >
              Trending
            </button>
            <button type="button" className="topicsFilters__chip">
              Categories
            </button>
            <button type="button" className="topicsFilters__chip">
              Recently Added
            </button>
          </section>

          <section className="topicsGrid">
            <article className="topicCard">
              <div className="topicCard__top">
                <span className="topicCard__category">Computer Science</span>
                <span className="topicCard__rating">4.8</span>
              </div>
              <h2>Machine Learning Basics</h2>
              <p className="topicCard__meta">
                12 lessons <span>•</span> 1,234 views
              </p>
              <button type="button" className="topicCard__button">
                Start Learning
              </button>
            </article>

            <article className="topicCard">
              <div className="topicCard__top">
                <span className="topicCard__category">Anatomy</span>
                <span className="topicCard__rating">4.9</span>
              </div>
              <h2>Cardiovascular System</h2>
              <p className="topicCard__meta">
                8 lessons <span>•</span> 987 views
              </p>
              <button type="button" className="topicCard__button">
                Start Learning
              </button>
            </article>

            <article className="topicCard">
              <div className="topicCard__top">
                <span className="topicCard__category">Chemistry</span>
                <span className="topicCard__rating">4.7</span>
              </div>
              <h2>Organic Chemistry</h2>
              <p className="topicCard__meta">
                15 lessons <span>•</span> 856 views
              </p>
              <button type="button" className="topicCard__button">
                Start Learning
              </button>
            </article>

            <article className="topicCard">
              <div className="topicCard__top">
                <span className="topicCard__category">Mathematics</span>
                <span className="topicCard__rating">4.6</span>
              </div>
              <h2>Linear Algebra</h2>
              <p className="topicCard__meta">
                10 lessons <span>•</span> 1,456 views
              </p>
              <button type="button" className="topicCard__button">
                Start Learning
              </button>
            </article>
          </section>
        </main>
    </>
  );
}