import { Link } from "react-router-dom";

export default function NoteCard({ note, onEdit, onDelete }) {
    return (
      <>
      <article className="noteCard">
  <Link to={`/notes/${note.id}`} className="noteCard__overlayLink"></Link>

  <div className="noteCard__header">
    <div>
      <h2 className="noteCard__title">{note.title}</h2>
    </div>

    <div className="noteCard__actions">
      <button className="noteCard__iconBtn" onClick={onEdit}>Edit</button>
      <button
        className="noteCard__iconBtn noteCard__iconBtn--danger"
        onClick={onDelete}
      >
        Delete
      </button>
    </div>
  </div>

  <p className="noteCard__text">
    {note.category || "No description added."}
  </p>

  <div className="noteCard__footer">
    <span className="noteCard__date">
      Updated {new Date(note.updatedAt).toLocaleDateString()}
    </span>

    <a className="noteCard__link" href={`/notes/${note.id}`}>
            View Details →
          </a>
  </div>
</article>


</>
    );
  }
