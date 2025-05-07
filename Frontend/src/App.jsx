// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import UpdateProfile from './pages/UpdateProfile';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import LearningPlanPage from './pages/LearningPlanPage';
import UpdateAndDeleteLearningPlan from './pages/UpdateAndDeleteLearningPlan';
import NavBar from './components/NavBar';
import Inbox from './components/Inbox';
import ChatWindow from './components/ChatWindow';
import ConnectionsPage from './components/ConnectionPage';


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

// Layout component that includes NavBar
const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      {children}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
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
                <Profile />
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


          <Route path="/connections" element={<ProtectedRoute><ConnectionsPage /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
          <Route path="/chat/:userId" element={<ProtectedRoute><ChatWindow /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;