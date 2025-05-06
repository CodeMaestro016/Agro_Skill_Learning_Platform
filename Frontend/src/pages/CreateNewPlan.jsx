import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createLearningPlan, updateLearningPlan } from '../services/api';

function CreateNewPlan({ setShowForm, onPlanCreated, onPlanUpdated, planToUpdate }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState({
    title: '',
    description: '',
    steps: [{ title: '', description: '', startDate: '', endDate: '' }],
    resources: [],
  });

  // Date validation functions
  const validateDates = (startDate, endDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start < today) {
      return 'Start date cannot be in the past';
    }

    if (end < today) {
      return 'End date cannot be in the past';
    }

    if (start > end) {
      return 'Start date cannot be after end date';
    }

    return '';
  };

  // Initialize form with plan data if updating
  useEffect(() => {
    if (planToUpdate) {
      setPlan({
        title: planToUpdate.title || '',
        description: planToUpdate.description || '',
        steps: planToUpdate.steps || [{ title: '', description: '', startDate: '', endDate: '' }],
        resources: planToUpdate.resources || [],
      });
    }
  }, [planToUpdate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!user || !user.id) {
      setError('User not authenticated properly');
      return;
    }

    // Validate all step dates before submission
    for (const step of plan.steps) {
      if (step.startDate && step.endDate) {
        const dateError = validateDates(step.startDate, step.endDate);
        if (dateError) {
          setError(dateError);
          return;
        }
      }
    }

    setLoading(true);

    try {
      const planData = {
        ...plan,
        userId: user.id,
        status: 'active',
        steps: plan.steps.map((step) => ({
          ...step,
          startDate: step.startDate || '',
          endDate: step.endDate || '',
        })),
        resources: plan.resources || [],
      };

      if (planToUpdate) {
        // Update existing plan
        await updateLearningPlan(planToUpdate.id, user.id, planData);
        onPlanUpdated();
      } else {
        // Create new plan
        const response = await createLearningPlan(planData);
        if (response) {
          onPlanCreated();
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setError(planToUpdate ? 'Failed to update learning plan' : 'Failed to create learning plan');
    } finally {
      setLoading(false);
    }
  };

  const addStep = () => {
    setPlan({
      ...plan,
      steps: [
        ...plan.steps,
        { title: '', description: '', startDate: '', endDate: '' },
      ],
    });
  };

  const removeStep = (index) => {
    const newSteps = plan.steps.filter((_, i) => i !== index);
    setPlan({ ...plan, steps: newSteps });
  };

  const updateStep = (index, field, value) => {
    const newSteps = [...plan.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    
    // Validate dates when both start and end dates are present
    if (field === 'startDate' || field === 'endDate') {
      const step = newSteps[index];
      if (step.startDate && step.endDate) {
        const dateError = validateDates(step.startDate, step.endDate);
        if (dateError) {
          setError(dateError);
        } else {
          setError('');
        }
      }
    }
    
    setPlan({ ...plan, steps: newSteps });
  };

  const addResource = () => {
    setPlan({
      ...plan,
      resources: [...plan.resources, { name: '', link: '' }],
    });
  };

  const removeResource = (index) => {
    const newResources = plan.resources.filter((_, i) => i !== index);
    setPlan({ ...plan, resources: newResources });
  };

  const updateResource = (index, field, value) => {
    const newResources = [...plan.resources];
    newResources[index] = { ...newResources[index], [field]: value };
    setPlan({ ...plan, resources: newResources });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl my-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {planToUpdate ? 'Update Learning Plan' : 'Create New Learning Plan'}
          </h2>
          <button
            onClick={() => setShowForm(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 gap-4">
            {/* Title and Description */}
            <div className="col-span-1">
              <input
                type="text"
                value={plan.title}
                onChange={(e) => setPlan({ ...plan, title: e.target.value })}
                placeholder="Plan Title"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-2"
                required
              />
              <textarea
                value={plan.description}
                onChange={(e) => setPlan({ ...plan, description: e.target.value })}
                placeholder="Plan Description"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                rows="2"
              />
            </div>

            {/* Steps Section */}
            <div className="col-span-1">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-gray-700 text-sm font-bold">Steps</label>
                <button
                  type="button"
                  onClick={addStep}
                  className="bg-green-500 hover:bg-green-700 text-white text-sm py-1 px-2 rounded"
                >
                  Add Step
                </button>
              </div>
              <div className="space-y-4">
                {plan.steps.map((step, index) => (
                  <div key={index} className="border rounded p-3">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={step.title}
                          onChange={(e) => updateStep(index, 'title', e.target.value)}
                          placeholder="Step Title"
                          className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 text-sm"
                          required
                        />
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <input
                          type="date"
                          value={step.startDate}
                          onChange={(e) => updateStep(index, 'startDate', e.target.value)}
                          className="shadow appearance-none border rounded py-1 px-2 text-gray-700 text-sm w-32"
                          required
                          min={new Date().toISOString().split('T')[0]}
                        />
                        <span className="text-xs text-gray-500">to</span>
                        <input
                          type="date"
                          value={step.endDate}
                          onChange={(e) => updateStep(index, 'endDate', e.target.value)}
                          className="shadow appearance-none border rounded py-1 px-2 text-gray-700 text-sm w-32"
                          required
                          min={step.startDate || new Date().toISOString().split('T')[0]}
                        />
                        {plan.steps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeStep(index)}
                            className="text-red-500 hover:text-red-700 text-sm ml-2"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="pl-4">
                      <textarea
                        value={step.description}
                        onChange={(e) => updateStep(index, 'description', e.target.value)}
                        placeholder="Step Description"
                        className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 text-sm"
                        rows="2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resources Section */}
            <div className="col-span-1">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-gray-700 text-sm font-bold">Resources</label>
                <button
                  type="button"
                  onClick={addResource}
                  className="bg-green-500 hover:bg-green-700 text-white text-sm py-1 px-2 rounded"
                >
                  Add Resource
                </button>
              </div>
              <div className="space-y-4">
                {plan.resources.map((resource, index) => (
                  <div key={index} className="border rounded p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold">Resource {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeResource(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <input
                        type="text"
                        value={resource.name}
                        onChange={(e) => updateResource(index, 'name', e.target.value)}
                        placeholder="Resource Name"
                        className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 text-sm"
                      />
                      <input
                        type="url"
                        value={resource.link}
                        onChange={(e) => updateResource(index, 'link', e.target.value)}
                        placeholder="Resource Link"
                        className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : planToUpdate ? 'Update Plan' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateNewPlan;
