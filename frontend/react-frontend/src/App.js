import logo from './logo.svg';
import './App.css';
import {HelmetProvider} from "react-helmet-async";
import AppLayout from "./layout/AppLayout";

// importing react router
import {BrowserRouter, Routes, Route} from "react-router-dom";

//importing pages
import Index from "./pages/index";
import Login from "./pages/login";
import Signup from "./pages/signup";
import DiscussionBoard from "./pages/discussion-board";
import Analytics from "./pages/analytics";
import ExploreTopics from "./pages/explore-topics";
import StudyGroups from "./pages/study-groups";
import Notes from "./pages/notes";
import NoteDetail from "./pages/notes_pages/note-detail";
import AiAssistant from "./pages/ai-assistant";
import TakeQuizzes from "./pages/take-quizzes";

import DiscussionNew from "./pages/discussion/discussion-new";
import DiscussionView from "./pages/discussion/discussion-view";

import NoteEditor from "./pages/notes_pages/notebook-editor";
import NoteView from "./pages/notes_pages/note-detail";

export default function App() {
  
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Index />} />
          <Route path="/discussion-board" element={<DiscussionBoard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/explore-topics" element={<ExploreTopics />} />
          <Route path="/study-groups" element={<StudyGroups />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/note/:id" element={<NoteDetail />} />
          <Route path="/ai-assistant" element={<AiAssistant />} />
          <Route path="/take-quizzes" element={<TakeQuizzes />} />
          <Route path="/discussion-board/new" element={<DiscussionNew />} />
          <Route path="/discussion-board/:id" element={<DiscussionView />} />
          <Route path="/notes/new" element={<NoteEditor />} />
          <Route path="/notes/edit/:id" element={<NoteEditor />} /> 
          <Route path="/notes/:id" element={<NoteView />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

      </Routes>

    </BrowserRouter>  
  );
}
