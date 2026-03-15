
import NoteCard from "../notes_pages/notes-card";

export default function NotesGrid({ notes, onEdit, onDelete }) {
  if (!notes || notes.length === 0) {
    return (
      <section className="notesGrid">
        <article className="noteCard">
          <h2>No notes yet</h2>
          <p className="noteCard__text">
            Create your first note by typing content or uploading a PDF/Word document.
          </p>
        </article>
      </section>
    );
  }

  return (
    <section className="notesGrid">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onEdit={() => onEdit(note)}
          onDelete={() => onDelete(note.id)}
        />
      ))}
    </section>
  );
}