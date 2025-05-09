// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import UpdateProfile from './pages/UpdateProfile';
import Profile from './pages/Profile';
import UserProfileView from './components/UserProfileView';
import ProtectedRoute from './components/ProtectedRoute';
import LearningPlanPage from './pages/LearningPlanPage';
import UpdateAndDeleteLearningPlan from './pages/UpdateAndDeleteLearningPlan';
import NavBar from './components/NavBar';
import Inbox from './components/Inbox';
import ChatWindow from './components/ChatWindow';
import ConnectionsPage from './components/ConnectionPage';
import About from './pages/About';
import SavedPosts from './pages/SavedPosts';
import Landing from './pages/Landing';
import Footer from './components/Footer';

// Placeholder components for new routes with compact layout
const Connections = () => (
  <div className="min-h-screen bg-gray-100 pb-16 pt-20">
    <div className="max-w-4xl mx-auto px-4">
      <div className="bg-white rounded-lg shadow-md p-4">Connections Page</div>
    </div>
  </div>
);

const ChatBox = () => (
  <div className="min-h-screen bg-gray-100 pb-16 pt-20">
    <div className="max-w-4xl mx-auto px-4">
      <div className="bg-white rounded-lg shadow-md p-4">ChatBox Page</div>
    </div>
  </div>
);

// Layout component that includes NavBar and Footer
const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      {children}
      <Footer /> {/* Added Footer here */}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/about" element={<About />} />
          <Route path="/community" element={<About />} />
          <Route path="/contact" element={<About />} />
          <Route path="/home" element={
            <ProtectedRoute>
              <Layout>
                <Home />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/learning-plan" element={
            <ProtectedRoute>
              <Layout>
                <LearningPlanPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/profile/:userId" element={
            <ProtectedRoute>
              <Layout>
                <UserProfileView />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/update-profile" element={
            <ProtectedRoute>
              <Layout>
                <UpdateProfile />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/update-plan/:id" element={
            <ProtectedRoute>
              <Layout>
                <UpdateAndDeleteLearningPlan />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="/connections" element={
            <ProtectedRoute>
              <Layout>
                <ConnectionsPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute>
              <Layout>
                <Inbox />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/chat/:userId" element={
            <ProtectedRoute>
              <Layout>
                <ChatWindow />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/saved" element={
            <ProtectedRoute>
              <Layout>
                <SavedPosts />
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;