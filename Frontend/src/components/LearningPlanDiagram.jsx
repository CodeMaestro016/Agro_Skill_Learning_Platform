import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactFlow, {
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { deleteLearningPlan, updateStepStatus, updateLearningPlan } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProgressBar from './ProgressBar';

const formatDateRange = (startDate, endDate) => {
  const isLong = startDate.length + endDate.length > 20;
  return isLong ? (
    <div className="text-sm text-gray-600 text-right">
      <div>Start: {startDate}</div>
      <div>End: {endDate}</div>
    </div>
  ) : (
    <span className="text-sm text-gray-600">{startDate} - {endDate}</span>
  );
};

const calculateNodeWidth = (title) => {
  // Return a consistent width for all nodes
  return 500;
};

const LearningPlanDiagram = ({ plan, onPlanDeleted, onPlanUpdated }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const initialNodes = plan.steps.map((step, index) => {
    const width = calculateNodeWidth(step.title);
    const y = 60 + index * 220;

    return {
      id: `step-${index}`,
      type: 'default',
      position: { x: 50, y },
      style: { 
        width,
        minHeight: 120,
        padding: '20px',
        backgroundColor: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      },
      data: {
        label: (
          <div className="text-center bg-white border border-gray-400 shadow-sm p-4 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-start gap-2 flex-1">
                <input
                  type="checkbox"
                  checked={step.stepStatus === 'complete'}
                  onChange={(e) => handleStepStatusChange(index, e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 mt-1 cursor-pointer"
                  disabled={isUpdating}
                />
                <div className="text-base font-semibold text-left break-words flex-1">{step.title}</div>
                <div className="ml-2">{formatDateRange(step.startDate, step.endDate)}</div>
              </div>
            </div>
            {step.description && (
              <div className="text-sm text-gray-600 mt-2 break-words whitespace-pre-wrap text-left border-t pt-2">
                {step.description}
              </div>
            )}
          </div>
        ),
      },
    };
  });

  const initialEdges = plan.steps.slice(0, -1).map((_, index) => ({
    id: `edge-${index}`,
    source: `step-${index}`,
    target: `step-${index + 1}`,
    type: 'straight',
    markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: '#000' },
    style: { stroke: '#000', strokeWidth: 2 },
  }));

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const handleUpdate = () => navigate(`/update-plan/${plan.id}`);
  const handleDeleteClick = () => setShowDeleteConfirm(true);
  const handleCancelDelete = () => setShowDeleteConfirm(false);

  const handleConfirmDelete = async () => {
    if (!user?.id) return;
    setIsDeleting(true);
    try {
      await deleteLearningPlan(plan.id, user.id);
      onPlanDeleted?.(plan.id);
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleStepStatusChange = async (stepIndex, isChecked) => {
    if (!user?.id) return;
    setIsUpdating(true);
    try {
      const newStatus = isChecked ? 'complete' : 'not complete';
      const updatedPlan = await updateStepStatus(plan.id, stepIndex, user.id, newStatus);

      if (isChecked) {
        setSuccessMessage(`Step "${plan.steps[stepIndex].title}" is now complete`);
        setTimeout(() => setSuccessMessage(''), 1500);
      }

      const allComplete = updatedPlan.steps.every(s => s.stepStatus === 'complete');
      const shouldUpdateStatus = (allComplete && updatedPlan.status !== 'complete') ||
                                 (!allComplete && updatedPlan.status === 'complete');

      if (shouldUpdateStatus) {
        const status = allComplete ? 'complete' : 'not complete';
        const finalPlan = await updateLearningPlan(updatedPlan.id, user.id, {
          ...updatedPlan, status,
        });
        onPlanUpdated?.(finalPlan);
      } else {
        onPlanUpdated?.(updatedPlan);
      }
    } catch (err) {
      console.error('Update error:', err);
      setSuccessMessage('');
    } finally {
      setIsUpdating(false);
    }
  };

  const progress = plan.steps.length > 0
    ? Math.round(plan.steps.filter((s) => s.stepStatus === 'complete').length / plan.steps.length * 100)
    : 0;

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="bg-white rounded-lg shadow-md p-6 flex-1" style={{ maxWidth: `${Math.max(...initialNodes.map(n => n.style.width)) + 300}px` }}>
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold">{plan.title}</h2>
            <div className="flex gap-2">
              <button onClick={handleUpdate} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-2 rounded text-sm">
                Edit Plan
              </button>
              <button onClick={handleDeleteClick} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-2 rounded text-sm">
                Delete Plan
              </button>
            </div>
          </div>
          {plan.description && (
            <p className="text-sm text-gray-600 break-words whitespace-pre-wrap mb-2">{plan.description}</p>
          )}
        </div>

        <div className="relative overflow-hidden rounded border border-gray-200 bg-slate-50 mx-auto"
             style={{ height: `${Math.max(500, plan.steps.length * 250)}px` }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            defaultZoom={1}
            minZoom={1}
            maxZoom={1}
            zoomOnScroll={false}
            zoomOnPinch={false}
            zoomOnDoubleClick={false}
            panOnScroll={false}
            panOnDrag={false}
            preventScrolling={true}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            onNodeClick={(e) => e.stopPropagation()}
          >
            <Background variant="dots" gap={12} size={1} />
          </ReactFlow>
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Confirm Deletion</h3>
              <p className="mb-6">Are you sure you want to delete this learning plan?</p>
              <div className="flex justify-end gap-4">
                <button onClick={handleCancelDelete} disabled={isDeleting}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">
                  Cancel
                </button>
                <button onClick={handleConfirmDelete} disabled={isDeleting}
                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                  {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      <div className="bg-white rounded-lg shadow-md p-4 w-full lg:w-80 h-fit">
        <h3 className="text-lg font-semibold mb-4">Progress</h3>
        <div className="space-y-4">
          <ProgressBar progress={progress} />
          <div className="text-sm text-gray-600">
            <p>Completed Steps: {plan.steps.filter(s => s.stepStatus === 'complete').length}</p>
            <p>Total Steps: {plan.steps.length}</p>
          </div>
          <div className="text-sm font-medium">
            Status: <span className={plan.status === 'complete' ? 'text-green-600' : 'text-yellow-600'}>
              {plan.status}
            </span>
          </div>
          {successMessage && (
            <div className="mt-2 p-2 bg-green-100 text-green-700 rounded text-sm">
              {successMessage}
            </div>
          )}
        </div>

        <div className="mt-6 border-t pt-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Resources</h3>
            <button onClick={handleUpdate} className="text-green-600 hover:text-green-800 text-sm font-medium">Edit</button>
          </div>
          {plan.resources?.length > 0 ? (
            <div className="space-y-3">
              {plan.resources.map((res, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-gray-600">{i + 1}.</span>
                    <p className="text-base font-medium">{res.name}</p>
                  </div>
                  {res.link && (
                    <div className="pl-6">
                      <a href={res.link} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:text-blue-800 break-words">
                        {res.link}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No resources added yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningPlanDiagram;
