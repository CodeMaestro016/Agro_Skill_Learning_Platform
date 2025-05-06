import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getLearningPlanById, updateLearningPlan, deleteLearningPlan } from '../services/api';

function UpdateAndDeleteLearningPlan() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    steps: [],
    resources: []
  });

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        if (!user || !user.id) {
          setError('User not authenticated');
          return;
        }
        const fetchedPlan = await getLearningPlanById(id, user.id);
        setPlan(fetchedPlan);
        setFormData({
          title: fetchedPlan.title || '',
          description: fetchedPlan.description || '',
          steps: fetchedPlan.steps || [],
          resources: Array.isArray(fetchedPlan.resources) ? fetchedPlan.resources : []
        });
        console.log('Fetched plan resources:', fetchedPlan.resources);
      } catch (err) {
        setError('Failed to load learning plan');
        console.error('Error fetching plan:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [id, user]);

  const handleUpdatePlan = async (e) => {
    e.preventDefault();
    try {
      await updateLearningPlan(id, user.id, formData);
      navigate('/learning-plan');
    } catch (error) {
      console.error('Error updating plan:', error);
      setError('Failed to update learning plan');
    }
  };

  const handleCancel = () => {
    navigate('/learning-plan');
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleConfirmDelete = async () => {
    if (!user || !user.id) return;
    
    setIsDeleting(true);
    try {
      await deleteLearningPlan(id, user.id);
      navigate('/learning-plan');
    } catch (error) {
      console.error('Error deleting plan:', error);
      setError('Failed to delete learning plan');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const updateStep = (index, field, value) => {
    const newSteps = [...formData.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setFormData({ ...formData, steps: newSteps });
  };

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [...formData.steps, { title: '', description: '', startDate: '', endDate: '' }]
    });
  };

  const removeStep = (index) => {
    const newSteps = formData.steps.filter((_, i) => i !== index);
    setFormData({ ...formData, steps: newSteps });
  };

  const addResource = () => {
    setFormData(prev => ({
      ...prev,
      resources: [
        ...prev.resources,
        {
          name: '',
          link: ''
        }
      ]
    }));
  };

  const updateResource = (index, field, value) => {
    setFormData(prev => {
      const updatedResources = [...prev.resources];
      updatedResources[index] = {
        ...updatedResources[index],
        [field]: value
      };
      return {
        ...prev,
        resources: updatedResources
      };
    });
  };

  const removeResource = (index) => {
    const newResources = formData.resources.filter((_, i) => i !== index);
    setFormData({ ...formData, resources: newResources });
  };

  if (loading) return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white p-6 rounded-lg">Loading...</div>
  </div>;

  if (error) return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white p-6 rounded-lg text-red-500">{error}</div>
  </div>;

  if (!plan) return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white p-6 rounded-lg">Plan not found</div>
  </div>;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center overflow-y-auto p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl my-8">
        {/* Modal Header */}
        <div className="border-b px-6 py-4">
          <h1 className="text-2xl font-bold">Update Learning Plan</h1>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          <form onSubmit={handleUpdatePlan} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                rows="4"
              />
            </div>

            {/* Steps */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-gray-700 text-sm font-bold">
                  Steps
                </label>
                <button
                  type="button"
                  onClick={addStep}
                  className="bg-green-500 hover:bg-green-700 text-white text-sm py-1 px-2 rounded"
                >
                  Add Step
                </button>
              </div>
              <div className="space-y-4">
                {formData.steps.map((step, index) => (
                  <div key={index} className="border rounded p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={step.title}
                          onChange={(e) => updateStep(index, 'title', e.target.value)}
                          placeholder="Step Title"
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-2"
                          required
                        />
                        <textarea
                          value={step.description}
                          onChange={(e) => updateStep(index, 'description', e.target.value)}
                          placeholder="Step Description"
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                          rows="2"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <input
                          type="date"
                          value={step.startDate}
                          onChange={(e) => updateStep(index, 'startDate', e.target.value)}
                          className="shadow appearance-none border rounded py-2 px-3 text-gray-700"
                          required
                        />
                        <input
                          type="date"
                          value={step.endDate}
                          onChange={(e) => updateStep(index, 'endDate', e.target.value)}
                          className="shadow appearance-none border rounded py-2 px-3 text-gray-700"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => removeStep(index)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resources Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-gray-700 text-sm font-bold">
                  Resources (Optional)
                </label>
                <button
                  type="button"
                  onClick={addResource}
                  className="bg-green-500 hover:bg-green-700 text-white text-sm py-1 px-2 rounded"
                >
                  Add Resource
                </button>
              </div>
              <div className="space-y-4">
                {formData.resources.map((resource, index) => (
                  <div key={index} className="flex items-center gap-4 mb-4">
                    <div className="flex-grow">
                      <input
                        type="text"
                        placeholder="Resource Name"
                        value={resource.name || ''}
                        onChange={(e) => updateResource(index, 'name', e.target.value)}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex-grow">
                      <input
                        type="url"
                        placeholder="Resource URL"
                        value={resource.link || ''}
                        onChange={(e) => updateResource(index, 'link', e.target.value)}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => removeResource(index)}
                      className="p-2 text-red-500 hover:text-red-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="border-t px-6 py-4 flex justify-end space-x-2">
          <button
            onClick={handleCancel}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleUpdatePlan}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Update Plan
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Confirm Deletion</h3>
            <p className="mb-6">
              Are you sure you want to delete this learning plan? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={handleCancelDelete}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UpdateAndDeleteLearningPlan;
