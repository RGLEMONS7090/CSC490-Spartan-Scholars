import './App.css';
import AppLayout from "./layout/AppLayout";

// importing react router
import {BrowserRouter, Routes, Route} from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

import {ProfileProvider} from "./context/profile-context";

//importing pages
import Index from "./pages/index";
import Landing from "./pages/landing";
import Login from "./pages/login";
import Signup from "./pages/signup";
import DiscussionBoard from "./pages/discussion-board";
import Analytics from "./pages/analytics";
import ExploreTopics from "./pages/explore-topics";
import StudyGroups from "./pages/study-groups";
import StudyGroupView from "./pages/study-groups/group-view";
import Notes from "./pages/notes";
import NoteDetail from "./pages/notes_pages/note-detail";
import AiAssistant from "./pages/ai-assistant";
import Profile from "./pages/profile";
import AdminAccess from "./pages/admin/admin-access";
import AdminUsers from "./pages/admin/admin-users";
import AdminUserDetail from "./pages/admin/admin-user-detail";
import AdminSessionBoundary from "./pages/admin/admin-session-boundary";
import TakeQuizzes from "./pages/take-quizzes";
import QuizCreate from "./pages/quizzes/quiz-create";
import QuizAiGenerator from "./pages/quizzes/quiz-ai-generator";
import QuizTestEditor from "./pages/quizzes/quiz-test-editor";
import QuizFlashcardEditor from "./pages/quizzes/quiz-flashcard-editor";
import QuizTestPlayer from "./pages/quizzes/quiz-test-player";
import QuizFlashcardPlayer from "./pages/quizzes/quiz-flashcard-player";

import DiscussionNew from "./pages/discussion/discussion-new";
import DiscussionView from "./pages/discussion/discussion-view";

import NoteEditor from "./pages/notes_pages/notebook-editor";
import NoteView from "./pages/notes_pages/note-detail";

export default function App() {
  
  return (
    <HelmetProvider>
      <ProfileProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/welcome" element={<Landing />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/discussion-board" element={<DiscussionBoard />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/explore-topics" element={<ExploreTopics />} />
              <Route path="/study-groups" element={<StudyGroups />} />
              <Route path="/study-groups/:id" element={<StudyGroupView />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/note/:id" element={<NoteDetail />} />
              <Route path="/ai-assistant" element={<AiAssistant />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/admin-access" element={<AdminAccess />} />
              <Route path="/take-quizzes" element={<TakeQuizzes />} />
              <Route path="/take-quizzes/create" element={<QuizCreate />} />
              <Route path="/take-quizzes/create/ai" element={<QuizAiGenerator />} />
              <Route path="/take-quizzes/create/test" element={<QuizTestEditor />} />
              <Route path="/take-quizzes/create/flashcards" element={<QuizFlashcardEditor />} />
              <Route path="/take-quizzes/:id" element={<QuizTestPlayer />} />
              <Route path="/take-quizzes/:id/flashcards" element={<QuizFlashcardPlayer />} />
              <Route path="/discussion-board/new" element={<DiscussionNew />} />
              <Route path="/discussion-board/:id" element={<DiscussionView />} />
              <Route path="/notes/new" element={<NoteEditor />} />
              <Route path="/notes/edit/:id" element={<NoteEditor />} /> 
              <Route path="/notes/:id" element={<NoteView />} />
              <Route element={<AdminSessionBoundary />}>
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/users/:id" element={<AdminUserDetail />} />
              </Route>
            </Route>

            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Routes>
        </BrowserRouter>
      </ProfileProvider>
    </HelmetProvider>
  );
}
