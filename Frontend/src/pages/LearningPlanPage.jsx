import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLearningPlans } from '../services/api'; // Import API service to fetch learning plans
import CreateNewPlan from './CreateNewPlan'; // Import component to create new learning plan
import { useAuth } from '../context/AuthContext'; // Assuming you have an AuthContext to manage user authentication
import LearningPlanDiagram from '../components/LearningPlanDiagram'; // Component to display learning plan diagrams

function LearningPlanPage() {
  const navigate = useNavigate();
  const { user, token } = useAuth(); // Get the user and token from context
  const [learningPlans, setLearningPlans] = useState([]); // State to hold list of learning plans
  const [loading, setLoading] = useState(true); // State to manage loading state
  const [error, setError] = useState(''); // State to handle errors
  const [showForm, setShowForm] = useState(false); // State to toggle visibility of form for creating a new plan
  const [successMessage, setSuccessMessage] = useState(''); // State to show success message after operations
  const [planToUpdate] = useState(null); // State to hold plan to update

  // Check for success message in localStorage when the component mounts
  useEffect(() => {
    const storedMessage = localStorage.getItem('learningPlanSuccessMessage');
    if (storedMessage) {
      setSuccessMessage(storedMessage); // Display success message if found
      localStorage.removeItem('learningPlanSuccessMessage');
      
      // Clear success message after 1 second
      setTimeout(() => {
        setSuccessMessage('');
      }, 1000);
    }
  }, []);

  // Fetch the learning plans when the component mounts or user changes
  useEffect(() => {
    if (user && user.id && token) {
      console.log('Fetching learning plans for user ID:', user?.id);
      fetchLearningPlans(user.id); // Fetch learning plans when user is authenticated
    } else {
      setError('User is not authenticated. Please log in.'); // Set error if user is not authenticated
    }
  }, [user, token]); // Run this effect whenever the user or token changes

  const fetchLearningPlans = async (userId) => {
    setLoading(true); // Set loading state
    try {
      const plans = await getLearningPlans(userId); // Fetch learning plans from API
      console.log('Fetched plans:', plans);
      setLearningPlans(plans); // Update state with fetched learning plans
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError(err.message || 'Failed to load learning plans.'); // Set error if fetching fails
    } finally {
      setLoading(false); // Set loading state to false after fetching
    }
  };
  

  const handleCreatePlan = () => {
    setShowForm(true); // Show the form when 'Create New Plan' button is clicked
  };

  const handlePlanCreated = () => {
    setShowForm(false); // Hide the form after plan creation
    showSuccessMessage('Learning plan created successfully!'); // Show success message
    fetchLearningPlans(user.id); // Re-fetch learning plans after creation
  };

  const handlePlanUpdated = () => {
    showSuccessMessage('Learning plan updated successfully!'); // Show success message after updating
    fetchLearningPlans(user.id); // Re-fetch learning plans after update
  };

  const handlePlanDeleted = (deletedPlanId) => {
    setLearningPlans(learningPlans.filter(plan => plan.id !== deletedPlanId)); // Remove deleted plan from state
    showSuccessMessage('Learning plan deleted successfully!'); // Show success message after deletion
  };

  const showSuccessMessage = (message) => {
    setSuccessMessage(message); // Set the success message
    localStorage.setItem('learningPlanSuccessMessage', message); // Store success message in localStorage
    
    setTimeout(() => {
      setSuccessMessage(''); // Clear success message after 1 second
      localStorage.removeItem('learningPlanSuccessMessage'); // Remove success message from localStorage
    }, 1000);
  };

  const scrollToDiagram = (planId) => {
    const element = document.getElementById(`diagram-${planId}`); // Get the diagram element by ID
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' }); // Scroll smoothly to the diagram
    }
  };

  const handleDeleteClick = async (plan) => {
    const isConfirmed = window.confirm(`Are you sure you want to delete "${plan.title}"?`);
    
    if (isConfirmed) {
      try {
        await handlePlanDeleted(plan.id);
      } catch (error) {
        console.error('Error deleting plan:', error);
        setError('Failed to delete learning plan');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Learning Plans</h1>
            <button
              onClick={handleCreatePlan}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Create New Plan
            </button>
          </div>

          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{successMessage}</span>
            </div>
          )}

          {/* Show loading, error, or no plans message */}
          {loading && <p>Loading...</p>}
          {error && <p className="text-red-500">{error}</p>}

          {!loading && learningPlans.length > 0 ? (
            <div>
              {/* Diagram Navigation Buttons */}
              <div className="flex flex-wrap gap-2 mb-6">
                {learningPlans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => scrollToDiagram(plan.id)}
                    className="bg-green-100 hover:bg-green-200 text-green-800 font-medium py-2 px-4 rounded"
                  >
                    {plan.title}
                  </button>
                ))}
              </div>

              {/* Diagrams Section */}
              <div className="space-y-8">
                {learningPlans.map((plan) => (
                  <div key={plan.id} id={`diagram-${plan.id}`} className="scroll-mt-4">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold">{plan.title}</h2>
                    </div>
                    <LearningPlanDiagram 
                      plan={plan} 
                      onPlanDeleted={handlePlanDeleted}
                      onPlanUpdated={handlePlanUpdated}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            !loading && (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-500">No learning plans available.</p>
                <button
                  onClick={handleCreatePlan}
                  className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Create Your First Plan
                </button>
              </div>
            )
          )}
        </div>
      </div>

      {/* Show form to create/update plan */}
      {showForm && (
        <CreateNewPlan 
          setShowForm={setShowForm} 
          onPlanCreated={handlePlanCreated}
          onPlanUpdated={handlePlanUpdated}
          planToUpdate={planToUpdate}
        />
      )}
    </div>
  );
}

export default LearningPlanPage;
