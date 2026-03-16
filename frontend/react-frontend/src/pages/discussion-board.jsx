import { Link, useNavigate } from "react-router-dom";
import {useState, useEffect} from "react";
import {Helmet} from "react-helmet-async";
import {fetchDiscussions} from "../assets/js/api/discussionAPi";

export default function DiscussionBoard() {

  {/* For discussions + state */}
  const[discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("all");
  const [error, setError] = useState("");

  {/* To Navigate */}
  const navigate = useNavigate();

  {/* for fast switching between filters*/}
  const[cache, setCache] = useState({
    all:null,
    trending: null,
    recent: null,
  });

  async function loadDiscussions(sortType = "all") {
    try {
      setError("");
  
      // If cached , show
      if (cache[sortType]) {
        setDiscussions(cache[sortType]);
        setLoading(false);
        return;
      } else {
        setLoading(true);
      }

      const data = await fetchDiscussions(sortType);
  
      // Update cache
      setCache(prev => ({ ...prev, [sortType]: data }));
      setDiscussions(data);
  
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDiscussions("all");
  }, []);

  function handleOpenDiscussion(id) {
    navigate(`/discussion-board/${id}`);
  }

  return (
    <>
      <Helmet>
        <title> Discussion Board </title>
      </Helmet>

        {/* Discussion Board Start */}
        <main className="main main--discussion">
          <section className="discussionTop">
            <div>
              <div className="discussionTitle">
                <div className="discussionTitle__icon">D</div>
                <h1>Discussion Board</h1>
              </div>
              <p className="discussionTop__subtitle">
                Ask questions and share knowledge with the community
              </p>
            </div>

            {/* Create New Discussion */}
            <Link to="/discussion-board/new"
              className="discussionTop__button discussionTop__button--link">
                + New Discussion
            </Link>
          </section>

          {/* Filters */}
        <section className="discussionFilters">
          {["all", "trending", "recent"].map((type) => (
            <button
              key={type}
              type="button"
              className={`discussionFilters__chip ${
                sort === type ? "discussionFilters__chip--active" : ""
              }`}
              onClick={() => {
                setSort(type);
                loadDiscussions(type);
              }}
            >
              {type === "all"
                ? "All Discussions"
                : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </section>

          {/* Discussion List */}
        <section className="discussionList">
          {loading && !cache[sort] && (
            <article className="discussionCard">
              <h2>Loading discussions...</h2>
              <p className="discussionCard__text">Fetching current posts.</p>
            </article>
          )}

          {error && (
            <article className="discussionCard">
              <h2>Error</h2>
              <p className="discussionCard__text">{error}</p>
            </article>
          )}

          {!loading && discussions.length === 0 && (
            <article className="discussionCard">
              <h2>No discussions yet</h2>
              <p className="discussionCard__text">
                Start the discussion with the + New Discussion button.
              </p>
            </article>
          )}

          {!loading &&
            discussions.map((d) => (
              <article key={d.id} className="discussionCard">
                <div className="discussionCard__header">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                      d.authorName
                    )}&background=9CC4FF&color=#1d4fae`}
                    alt={d.authorName}
                    className="discussionCard__avatar"
                  />

                  <div>
                    <h2>{d.title}</h2>
                    <p className="discussionCard__author">by {d.authorName}</p>
                  </div>
                </div>

                <p className="discussionCard__text">{d.description}</p>

                <div className="discussionCard__footer">
                  <div className="discussionCard__stats discussionCard__meta">
                    <span>{d.likeCount} likes</span>
                    <span>{d.commentCount} comments</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenDiscussion(d.id)}
                    className="discussionCard__action"
                  >
                  View Discussion
                  </button>
                </div>
              </article>
          ))}
        </section>
      </main> 
    </>
  );
}
