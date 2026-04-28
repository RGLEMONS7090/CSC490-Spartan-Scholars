import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../../assets/js/api/notesApi";
import useAutosave from "../../assets/js/utils/useAutosave";
import {Helmet} from "react-helmet-async";

export default function NoteEditor() {
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const { id } = useParams();
  const navigate = useNavigate();

  const [note, setNote] = useState({
    title: "",
    category: "",
    content: "",
  });
  const [saved, setSaved] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentAttachment, setCurrentAttachment] = useState(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [lastUploadedFileName, setLastUploadedFileName] = useState("");
  const [currentNoteId, setCurrentNoteId] = useState(id ?? null);
  const [fileError, setFileError] = useState("");

  const loadedRef = useRef(false);
  const saveInFlightRef = useRef(false);
  const queuedSaveRef = useRef(false);
  const lastSavedSnapshotRef = useRef("");
  const editorStateRef = useRef(null);

  useEffect(() => {
    setCurrentNoteId(id ?? null);
  }, [id]);

  editorStateRef.current = {
    note,
    noteId: currentNoteId,
    attachment: currentAttachment,
    removeAttachment,
    selectedFile,
  };

  function buildSnapshot(noteValue, noteIdValue, attachmentValue, removeAttachmentValue, selectedFileValue) {
    return JSON.stringify({
      id: noteIdValue ?? null,
      title: noteValue.title || "",
      category: noteValue.category || "",
      content: noteValue.content || "",
      attachment: attachmentValue?.fileName || "",
      removeAttachment: removeAttachmentValue,
      selectedFile: selectedFileValue?.name || "",
    });
  }

  function buildAttachmentState(savedNote) {
    return savedNote.hasAttachment
      ? { fileName: savedNote.fileName, fileContentType: savedNote.fileContentType }
      : null;
  }

  function mergeExtractedContent(baseContent, savedContent, currentContent) {
    if (!savedContent || savedContent === baseContent) {
      return currentContent;
    }

    if (currentContent === baseContent) {
      return savedContent;
    }

    if (savedContent.startsWith(baseContent)) {
      const extractedSuffix = savedContent.slice(baseContent.length);
      if (extractedSuffix && !currentContent.endsWith(extractedSuffix)) {
        return currentContent + extractedSuffix;
      }
    }

    return currentContent;
  }

  const autosaveSnapshot = buildSnapshot(
    note,
    currentNoteId,
    currentAttachment,
    removeAttachment,
    selectedFile
  );

  useEffect(() => {
    if (!id) {
      loadedRef.current = true;
      return;
    }

    async function loadNote() {
      const res = await apiFetch(`/api/notes/${id}`);
      const data = await res.json();

      const nextNote = {
        title: data.title || "",
        category: data.category || "",
        content: data.content || "",
      };
      const nextAttachment = data.hasAttachment
        ? { fileName: data.fileName, fileContentType: data.fileContentType }
        : null;

      setNote(nextNote);
      setCurrentAttachment(nextAttachment);
      setLastUploadedFileName(data.hasAttachment ? (data.fileName || "") : "");
      setRemoveAttachment(false);
      setSelectedFile(null);
      lastSavedSnapshotRef.current = buildSnapshot(nextNote, id, nextAttachment, false, null);
      loadedRef.current = true;
    }

    loadNote();
  }, [id]);

  async function saveNote(latestState = editorStateRef.current) {
    const {
      note: latestNote,
      noteId: latestNoteId,
      attachment: latestAttachment,
      removeAttachment: latestRemoveAttachment,
      selectedFile: latestSelectedFile,
    } = latestState;

    if (saveInFlightRef.current) {
      queuedSaveRef.current = true;
      return;
    }

    if (!latestNote.title || !latestNote.title.trim()) {
      setSaved(true);
      return;
    }

    const snapshot = buildSnapshot(
      latestNote,
      latestNoteId,
      latestAttachment,
      latestRemoveAttachment,
      latestSelectedFile
    );
    if (snapshot === lastSavedSnapshotRef.current) {
      setSaved(true);
      return;
    }

    saveInFlightRef.current = true;
    setSaved(false);

    const formData = new FormData();
    formData.append("title", latestNote.title || "");
    formData.append("category", latestNote.category || "");
    formData.append("content", latestNote.content || "");
    formData.append("removeAttachment", latestRemoveAttachment ? "true" : "false");
    if (latestSelectedFile) {
      formData.append("file", latestSelectedFile);
    }

    const isNew = !latestNoteId;
    const url = isNew ? "/api/notes" : `/api/notes/${latestNoteId}`;
    const method = isNew ? "POST" : "PUT";

    try {
      const res = await apiFetch(url, { method, body: formData });
      const savedNote = await res.json();
      const nextAttachment = buildAttachmentState(savedNote);
      const persistedSnapshot = buildSnapshot(
        {
          title: savedNote.title || "",
          category: savedNote.category || "",
          content: savedNote.content || "",
        },
        savedNote.id,
        nextAttachment,
        false,
        null
      );
      const currentState = editorStateRef.current;
      const stateChangedSinceRequest = buildSnapshot(
        currentState.note,
        currentState.noteId,
        currentState.attachment,
        currentState.removeAttachment,
        currentState.selectedFile
      ) !== snapshot;

      lastSavedSnapshotRef.current = persistedSnapshot;
      setCurrentAttachment(nextAttachment);
      setLastUploadedFileName(savedNote.hasAttachment ? (savedNote.fileName || "") : "");
      setSelectedFile(null);
      setRemoveAttachment(false);

      if (stateChangedSinceRequest) {
        const mergedNote = {
          title: currentState.note.title === latestNote.title ? (savedNote.title || "") : currentState.note.title,
          category: currentState.note.category === latestNote.category ? (savedNote.category || "") : currentState.note.category,
          content: mergeExtractedContent(latestNote.content || "", savedNote.content || "", currentState.note.content || ""),
        };
        setNote(mergedNote);
        editorStateRef.current = {
          note: mergedNote,
          noteId: savedNote.id,
          attachment: nextAttachment,
          removeAttachment: false,
          selectedFile: null,
        };
        setSaved(false);
      } else {
        const nextNote = {
          title: savedNote.title || "",
          category: savedNote.category || "",
          content: savedNote.content || "",
        };
        setNote(nextNote);
        editorStateRef.current = {
          note: nextNote,
          noteId: savedNote.id,
          attachment: nextAttachment,
          removeAttachment: false,
          selectedFile: null,
        };
        setSaved(true);
      }

      if (isNew) {
        setCurrentNoteId(savedNote.id);
        navigate(`/notes/edit/${savedNote.id}`, { replace: true });
      }
      return savedNote;
    } finally {
      saveInFlightRef.current = false;

      if (queuedSaveRef.current) {
        queuedSaveRef.current = false;
        setTimeout(() => saveNote(editorStateRef.current), 0);
      }
    }
  }

  useAutosave(autosaveSnapshot, () => {
    if (!loadedRef.current) {
      return;
    }
    saveNote(editorStateRef.current);
  }, 800);

  function updateField(field, value) {
    setSaved(false);
    setNote((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  return (
    <>
    <Helmet>
        <title>Edit Notebook</title>
    </Helmet>

    <div className="noteEditor">
      <header className="noteEditor__header">
        <div className="noteEditor__nav">
          <button onClick={() => navigate("/notes")}>Back</button>
          {currentNoteId && (
            <Link className="noteEditor__viewBtn" to={`/notes/${currentNoteId}`}>
              View Details
            </Link>
          )}
        </div>

        <div className="noteEditor__actions">
          <span className="noteEditor__status">{saved ? "Saved" : "Saving..."}</span>
          <button
            className="noteEditor__saveBtn"
            disabled={!note.title.trim()}
            onClick={() => saveNote(editorStateRef.current)}
          >
            Save
          </button>
        </div>
      </header>

      <div className="noteEditor__form">
        <div className="noteEditor__topRow">
        <div className="noteEditor__left">
        <input
          className="noteEditor__title"
          value={note.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="Note title..."
        />

        <input
          className="noteEditor__category"
          value={note.category}
          onChange={(e) => updateField("category", e.target.value)}
          placeholder="Category (optional)"
        />
        </div>

        <div className="noteEditor__right">
          {/*<label className="fileLabel" htmlFor="noteFile">
            Upload File
          </label> */}
        {/*<div className="noteEditor__file">
          <label htmlFor="noteFile">Upload PDF or Word file</label>*/}

          <label htmlFor="noteFile" className="uploadBtn">
            Choose File
          </label>

          {fileError && <p className="fileError">{fileError}</p>}

          <input
            id="noteFile"
            type="file"
            accept=".pdf,.doc,.docx, .jpg, .jpeg, .png"
            onChange={(e) => {
              const nextFile = e.target.files?.[0] ?? null;
              
              //setSelectedFile(nextFile);
              if (nextFile && nextFile.size > MAX_FILE_SIZE) {
                setFileError("This file is too large. Maximum size is 10MB.");
                //e.target.value = ""; // reset input
                //return;
              
              setSelectedFile(null);
              setLastUploadedFileName("");
              setRemoveAttachment(false);
              
                e.target.value = "";
                return;
              }

              setFileError("");
              setSelectedFile(nextFile);

              if (nextFile) {
                setLastUploadedFileName("");
                setRemoveAttachment(false);
                setSaved(false);
              }
            }}
          />

          {currentAttachment && !removeAttachment && !selectedFile && (
            <p className="fileInfo">
              Current attachment:{" "}
              <a href={`http://localhost:8080/api/notes/${currentNoteId}/download`} target="_blank" rel="noreferrer">
                {currentAttachment.fileName}
              </a>
            </p>
          )}

          {selectedFile && <p className="fileInfo">Selected file: {selectedFile.name}</p>}

          {/*{!selectedFile && lastUploadedFileName && <p className="fileInfo">Attached file: {lastUploadedFileName}</p>} */}

          {(currentAttachment || selectedFile) && (
            <label className="removeFile">
              <input
                type="checkbox"
            checked={removeAttachment}
            onChange={(e) => {
              const checked = e.target.checked;
              setRemoveAttachment(checked);
              if (checked) {
                setSelectedFile(null);
              } else if (currentAttachment) {
                setLastUploadedFileName(currentAttachment.fileName || "");
              }
              setSaved(false);
            }}
              />
              Remove attachment
            </label>
          )}
        </div>
        </div>

        <textarea
          className="noteEditor__content modern-textarea"
          value={note.content}
          onChange={(e) => updateField("content", e.target.value)}
          placeholder="Start typing your notes..."
        />

        {/* FILE PREVIEW */}
        <div className="noteEditor__preview">
          {/* IMAGE PREVIEW */}
            {currentAttachment &&
              currentAttachment.fileContentType?.startsWith("image/") &&
              !removeAttachment &&
              !selectedFile && (
                <img
                  src={`http://localhost:8080/api/notes/${currentNoteId}/preview`}
                  alt="Attachment preview"
                  className="preview-image"
                />
              )}

          {/* PDF PREVIEW */}
            {currentAttachment &&
              currentAttachment.fileContentType === "application/pdf" &&
              !removeAttachment &&
              !selectedFile && (
                <iframe
                  src={`http://localhost:8080/api/notes/${currentNoteId}/preview`}
                  className="preview-pdf"
                  title="PDF Preview"
                />
              )}

          {/* WORD FILE PREVIEW */}
            {currentAttachment &&
              currentAttachment.fileContentType?.includes("word") &&
              !removeAttachment &&
              !selectedFile && (
                <div className="preview-doc">
                  <span>📄 {currentAttachment.fileName}</span>
                  <a
                    href={`http://localhost:8080/api/notes/${currentNoteId}/download`}
                    target="_blank"
                    rel="noreferrer"
                  >
                  Download
                  </a>
                </div>
              )}

          {/* PREVIEW FOR NEWLY SELECTED FILE */}
            {selectedFile && selectedFile.type.startsWith("image/") && (
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Selected preview"
                className="preview-image"
              />
            )}

            {selectedFile && selectedFile.type === "application/pdf" && (
              <iframe
                src={URL.createObjectURL(selectedFile)}
                className="preview-pdf"
                title="PDF Preview"
              />
            )}

            {selectedFile &&
              selectedFile.type.includes("word") && (
              <div className="preview-doc">
                <span>📄 {selectedFile.name}</span>
                <p>Word files cannot be previewed. You can still upload it.</p>
              </div>
              )}
        </div>
      
      </div>
    </div>
  </>
  );
}
