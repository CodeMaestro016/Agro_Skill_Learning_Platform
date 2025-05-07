import { createContext, useState, useContext, useEffect } from 'react';
import { createLearningPlan, getLearningPlans } from '../services/api'; // Assuming these functions are defined in api.js

// Create Context for Learning Plans
const LearningPlanContext = createContext();

// Provider Component
export const LearningPlanProvider = ({ children }) => {
  const [learningPlans, setLearningPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLearningPlans = async () => {
      setLoading(true);
      try {
        const plans = await getLearningPlans(); // Fetch all learning plans from the API
        setLearningPlans(plans);
      } catch (err) {
        setError('Failed to load learning plans');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLearningPlans();
  }, []);

  const addLearningPlan = async (plan) => {
    setLoading(true);
    try {
      const newPlan = await createLearningPlan(plan); // Create a new plan via API
      setLearningPlans((prevPlans) => [...prevPlans, newPlan]); // Add new plan to state
    } catch (err) {
      setError('Failed to create learning plan');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LearningPlanContext.Provider value={{ learningPlans, addLearningPlan, loading, error }}>
      {children}
    </LearningPlanContext.Provider>
  );
};

// Custom hook to use the LearningPlanContext
export const useLearningPlans = () => {
  const context = useContext(LearningPlanContext);
  if (!context) {
    throw new Error('useLearningPlans must be used within a LearningPlanProvider');
  }
  return context;
};
