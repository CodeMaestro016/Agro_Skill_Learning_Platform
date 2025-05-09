import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import NavBar from './NavBar';

const UserProfileView = ({ user, onClose }) => {
  const [posts, setPosts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const postsPerPage = 2;
  const [currentPlanIndex, setCurrentPlanIndex] = useState(0);

  const { token } = useAuth();

  useEffect(() => {
    const fetchUserContent = async () => {
      try {
        setLoading(true);
        setError(null);

        const postsRes = await axios.get(`http://localhost:8081/api/auth/posts?userId=${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPosts(Array.isArray(postsRes.data) ? postsRes.data : []);

        const plansRes = await axios.get(`http://localhost:8081/api/auth/learning-plan?userId=${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPlans(Array.isArray(plansRes.data) ? plansRes.data : []);
      } catch (err) {
        console.error('Failed to fetch user content:', err);
        setError('Failed to load user content. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserContent();
  }, [user.id, token]);

  const totalPages = Math.ceil(posts.length / postsPerPage);
  const paginatedPosts = posts.slice(
    currentPage * postsPerPage,
    currentPage * postsPerPage + postsPerPage
  );

  const calculateProgress = (plan) => {
    if (!plan || !Array.isArray(plan.steps) || plan.steps.length === 0) return 0;
    const completedSteps = plan.steps.filter(
      step => typeof step.status === 'string' && step.status.trim().toLowerCase() === 'completed'
    ).length;
    return Math.round((completedSteps / plan.steps.length) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      {/* Back to Connections Button at the top */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <button
          onClick={onClose}
          className="mb-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Connections
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6">
            <div className="flex items-center justify-between">
              <button
                onClick={onClose}
                className="text-gray-600 hover:text-gray-800 flex items-center"
              >
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Connections
              </button>
            </div>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="flex-shrink-0">
                {user.profilePhoto ? (
                  <img
                    src={user.profilePhoto}
                    alt={`${user.firstName}'s profile`}
                    className="w-40 h-40 rounded-full object-cover border-4 border-green-500"
                  />
                ) : (
                  <div className="w-40 h-40 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-5xl font-semibold">
                    {user.firstName?.[0]}
                  </div>
                )}
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {user.firstName} {user.lastName}
                </h1>
                <p className="text-gray-600 text-lg mb-4">{user.email}</p>
                {user.location && (
                  <p className="text-gray-600 flex items-center justify-center md:justify-start">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {user.location}
                  </p>
                )}
                {user.about && (
                  <div className="mt-4">
                    <p className="text-gray-700">{user.about}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-700 px-4 py-2">Posts</h2>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
              </div>
            ) : error ? (
              <p className="text-red-500 text-center py-4">{error}</p>
            ) : posts.length > 0 ? (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paginatedPosts.map((post) => (
                    <div key={post.id} className="bg-gray-50 rounded-lg p-4 flex flex-col">
                      <div className="flex-1 mb-2 overflow-y-auto">
                        <p className="text-xs text-gray-500 mb-1">
                          {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Date not available'}
                        </p>
                        <p className="text-sm text-gray-700 mb-2">{post.content}</p>
                        {post.imageUrls && post.imageUrls.length > 0 && (
                          <div className="grid grid-cols-2 gap-2">
                            {post.imageUrls.map((imageUrl, index) => (
                              <img
                                key={index}
                                src={imageUrl}
                                alt={`Post attachment ${index + 1}`}
                                className="rounded-lg h-48 w-full object-cover"
                              />
                            ))}
                          </div>
                        )}
                        {post.videoUrl && (
                          <video
                            controls
                            className="rounded-lg w-full h-64 object-cover mt-2"
                            src={post.videoUrl}
                          >
                            Your browser does not support the video tag.
                          </video>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center items-center mt-4 space-x-4">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
                    disabled={currentPage === 0}
                    className={`px-3 py-1 rounded ${currentPage === 0 ? 'text-gray-400' : 'text-green-600 hover:text-green-800'}`}
                  >
                    &lt;
                  </button>
                  <span className="text-sm text-gray-500">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
                    disabled={currentPage >= totalPages - 1}
                    className={`px-3 py-1 rounded ${currentPage >= totalPages - 1 ? 'text-gray-400' : 'text-green-600 hover:text-green-800'}`}
                  >
                    &gt;
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Learning Plans Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-700 px-4 py-2">Learning Plans</h2>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
              </div>
            ) : error ? (
              <p className="text-red-500 text-center py-4">{error}</p>
            ) : plans.length > 0 ? (
              <div>
                <div className="relative">
                  {/* Navigation Buttons */}
                  <button
                    onClick={() => setCurrentPlanIndex(prev => Math.max(prev - 1, 0))}
                    disabled={currentPlanIndex === 0}
                    className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full ${
                      currentPlanIndex === 0 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentPlanIndex(prev => Math.min(prev + 1, plans.length - 1))}
                    disabled={currentPlanIndex === plans.length - 1}
                    className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full ${
                      currentPlanIndex === plans.length - 1 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Current Plan Display */}
                  <div className="bg-gray-50 rounded-lg p-6 mx-8">
                    <h3 className="font-semibold text-lg text-gray-800 mb-2">
                      {plans[currentPlanIndex].title || 'Untitled Plan'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {plans[currentPlanIndex].description || 'No description available'}
                    </p>

                    <div className="space-y-2">
                      {/* Remove the date part with the calendar icon and the status part */}
                    </div>

                    {/* Learning Steps Diagram */}
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-700 mb-3">Learning Steps</h4>
                      <div className="flex items-center overflow-x-auto pb-4">
                        {plans[currentPlanIndex].steps.map((step, index) => {
                          // Determine color and icon for step
                          let circleColor = "bg-gray-200 border-gray-300 text-gray-500";
                          let connectorColor = "bg-gray-300";
                          let icon = index + 1;
                          if (step.status === "COMPLETED") {
                            circleColor = "bg-green-500 border-green-600 text-white";
                            connectorColor = "bg-green-400";
                            icon = (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            );
                          } else if (step.status === "IN_PROGRESS") {
                            circleColor = "bg-yellow-400 border-yellow-500 text-white";
                            connectorColor = "bg-yellow-300";
                            icon = (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="5" />
                              </svg>
                            );
                          }
                          return (
                            <div key={index} className="flex items-center">
                              {/* Step Circle */}
                              <div className="flex flex-col items-center">
                                <div className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${circleColor}`}>
                                  {icon}
                                </div>
                                <span className="mt-2 text-xs text-center w-32">{step.description}</span>
                                <span className={`text-xs mt-1 ${
                                  step.status === 'COMPLETED' ? 'text-green-600'
                                  : step.status === 'IN_PROGRESS' ? 'text-yellow-600'
                                  : 'text-gray-400'
                                }`}>
                                  {step.status ? step.status.replace('_', ' ').toLowerCase() : 'not started'}
                                </span>
                              </div>
                              {/* Connector */}
                              {index < plans[currentPlanIndex].steps.length - 1 && (
                                <div className={`w-10 h-1 mx-2 rounded ${connectorColor}`}></div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Plan Navigation Dots */}
                <div className="flex justify-center mt-4 space-x-2">
                  {plans.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPlanIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentPlanIndex ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No learning plans available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileView;
