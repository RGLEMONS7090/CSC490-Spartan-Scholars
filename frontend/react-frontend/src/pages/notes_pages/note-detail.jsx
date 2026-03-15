import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiFetch } from "../../assets/js/api/notesApi";

export default function NoteDetails() {
  const { id } = useParams();
  const [note, setNote] = useState(null);

  useEffect(() => {
    async function load() {
      const res = await apiFetch(`/api/notes/${id}`);
      const data = await res.json();
      setNote(data);
    }
    load();
  }, [id]);

  if (!note) {
    return <p>Loading...</p>;
  }

  return (
    <main className="noteDetails">
      <header className="noteDetails__header">
        <Link to="/notes" className="noteDetails__back">← Back to Notes</Link>
        <Link to={`/notes/edit/${id}`} className="noteDetails__editBtn">
          Edit Note
        </Link>
      </header>

      <h1 className="noteDetails__title">{note.title}</h1>
      <p className="noteDetails__updated"> Updated {new Date(note.updatedAt). toLocaleString()}</p>
      <p className="noteDetails__category">{note.category}</p>

      <article className="noteDetails__content">
        {note.content.split("\n").map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </article>

      {note.fileName && (
        <a href={`/api/notes/${id}/download`} className="noteDetails__attachment">
        Download Attachment ({note.fileName})
      </a>
      )}
    </main>
  );
}