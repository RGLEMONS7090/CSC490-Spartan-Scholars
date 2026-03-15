import { Link, useNavigate } from "react-router-dom";
import {useState} from "react";
import useTheme from "../../assets/js/useTheme";
import {logout} from "../../assets/js/utils/logout";
import {Helmet} from "react-helmet-async";


export default function DiscussionNew() {
  
  const navigate = useNavigate();

  const[title,setTitle] = useState("");
  const[description,setDescription] = useState("");

  const token = localStorage.getItem("token");

  async function handleSubmit(e){
    e.preventDefault();
    if (!token){
        alert("You must be logged in.");
        return;
    }

    try{
        const response = await fetch("/api/discussions", {
            method:"POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({title, description}),
        });

        if (!response.ok){
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || "Failed to create discussion.");
        }

        navigate("/discussion-board");
    } catch(err){
        alert(err.message);
    }
  }

  return (
    <> 
      <Helmet>
        <title> Create Discussion Board </title>
      </Helmet>
      
        <main className="main main--discussion">
        <section className="discussionTop">
          <div>
            <div className="discussionTitle">
              <div className="discussionTitle__icon">+</div>
              <h1>New Discussion</h1>
            </div>
            <p className="discussionTop__subtitle">
              Create a title and description, then publish to the board.
            </p>
          </div>

          <Link to="/discussion-board" className="discussionTop__button discussionTop__button--link">
            Back to Board
          </Link>
        </section>

        <article className="discussionCard">
          <form id="newDiscussionForm" className="d-grid gap-3" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="discussionTitle" className="form-label">
                Title
              </label>
              <input
                id="discussionTitle"
                name="title"
                type="text"
                className="form-control"
                maxLength="200"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="discussionDescription" className="form-label">
                Description
              </label>
              <textarea
                id="discussionDescription"
                name="description"
                className="form-control"
                rows="8"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>

            <div className="d-flex justify-content-end">
              <button type="submit" className="discussionTop__button">
                Done
              </button>
            </div>
          </form>
        </article>
      </main>
    </>
  )
}
