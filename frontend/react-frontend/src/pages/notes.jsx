import {useEffect, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import useTheme from "../assets/js/useTheme";
import {logout} from "../assets/js/utils/logout";
import {Helmet} from "react-helmet-async";
import {apiFetch} from "../assets/js/api/notesApi";
import NotesGrid from "./notes_pages/notes-grid";

import notebookLogo from "../assets/images/notebook_logo.png";
import darkModeNotebookLogo from "../assets/images/dark_mode_notebook_logo.png";

export default function Notebook(){
  const navigate = useNavigate();

  useEffect(() => {
    const notesShell = document.querySelector(".shell");
    const toggleBtn = document.getElementById("notesSidebarToggle");

    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        notesShell.classList.toggle("shell--collapsed");
      });
    }

    return () => {
      if (toggleBtn) {
        toggleBtn.removeEventListener("click", () => {});
      }
    };
  }, []);

  // For notes
  const[notes, setNotes] = useState([]);
  const[editingNote, setEditingNote] = useState(null);

  // Loads the notes
  useEffect(() => { loadNotes();}, []);

  async function loadNotes(){
    const response = await apiFetch("/api/notes");
    if (!response) return;
    const data = await response.json();
    setNotes(data);
  }

  function openNewNote() {
    navigate("/notes/new");
  }

  function openEdit(note) {
    navigate(`/notes/edit/${note.id}`);
  }

  async function deleteNote(id) {
    if (!window.confirm("Delete this note?")) return;
    await apiFetch(`/api/notes/${id}`, { method: "DELETE" });
    loadNotes();
  }

  return (
    <>
      <Helmet>
        <title> Notebook </title>
      </Helmet>

      <main className="main main--notes">
      <section className="notesHeader">
            <div className="notesHeader__title">
              <div className="notesHeader__icon notesHeader__icon--image">
                <img
                  src={notebookLogo}
                  className="notesHeader__logo notesHeader__logo--light"
                  alt="Notebook logo"
                />
                <img
                  src={darkModeNotebookLogo}
                  className="notesHeader__logo notesHeader__logo--dark"
                  alt="Notebook logo"
                />
              </div>

              <div>
                <h1>Notebook</h1>
                <p>
                  <span> {notes.length} </span> notes saved
                </p>
              </div>
            </div>

            <button id="newNoteBtn" 
              className="notesHeader__button"
              onClick={openNewNote}>
              + New Note
            </button>
          </section>

          <NotesGrid 
            notes={notes} 
            onEdit={openEdit} 
            onDelete={deleteNote} />
          
        </main>
    </>
  );
}

