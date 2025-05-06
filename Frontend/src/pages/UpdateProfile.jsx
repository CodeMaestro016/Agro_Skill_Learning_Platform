import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const UpdateProfile = () => {
  const { user, token, updateUser } = useAuth();
  const navigate = useNavigate();

  const firstNameRef = useRef(null);
  const lastNameRef = useRef(null);
  const aboutRef = useRef(null);
  const addressRef = useRef(null);
  const contactNumberRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    about: user?.about || '',
    address: user?.address || '',
    contactNumber: user?.contactNumber || '',
    coverPhoto: user?.coverPhoto || '',
    profilePhoto: user?.profilePhoto || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null); // To capture error messages

  // Focus first input when component mounts
  useEffect(() => {
    firstNameRef.current?.focus();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Store the file object for upload
        setFormData(prev => ({ ...prev, [e.target.name]: file }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
  
    try {
      // Create FormData object for multipart/form-data
      const formDataToSend = new FormData();
      
      // Add text fields
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('about', formData.about);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('contactNumber', formData.contactNumber);
      
      // Add files if they've changed
      if (formData.profilePhoto instanceof File) {
        formDataToSend.append('profilePhoto', formData.profilePhoto);
      }
      if (formData.coverPhoto instanceof File) {
        formDataToSend.append('coverPhoto', formData.coverPhoto);
      }

      const response = await fetch('http://localhost:8081/api/user/update', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });
  
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Update failed');
      }
  
      const updatedUser = await response.json();
      
      // Update the user context with the new data
      updateUser(updatedUser);
      
      // Navigate to profile page after successful update
      navigate('/profile');
    } catch (error) {
      setError(error.message);
      console.error('Update failed:', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-xl w-full">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center text-gray-600 hover:text-green-600 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Update Profile</h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input 
              ref={firstNameRef}
              id="firstName"
              name="firstName" 
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500" 
              value={formData.firstName} 
              onChange={handleChange}
              required 
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input 
              ref={lastNameRef}
              id="lastName"
              name="lastName" 
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500" 
              value={formData.lastName} 
              onChange={handleChange}
              required 
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input 
              id="email"
              name="email" 
              disabled 
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100" 
              value={formData.email} 
            />
          </div>
          
          <div>
            <label htmlFor="about" className="block text-sm font-medium text-gray-700 mb-1">
              About
            </label>
            <textarea 
              ref={aboutRef}
              id="about"
              name="about" 
              rows="3" 
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500" 
              value={formData.about} 
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input 
              ref={addressRef}
              id="address"
              name="address" 
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500" 
              value={formData.address} 
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Contact Number
            </label>
            <input 
              ref={contactNumberRef}
              id="contactNumber"
              name="contactNumber" 
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500" 
              value={formData.contactNumber} 
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label htmlFor="profilePhoto" className="block text-sm font-medium text-gray-700 mb-1">
              Profile Photo
            </label>
            <input 
              id="profilePhoto"
              type="file" 
              name="profilePhoto" 
              accept="image/*"
              className="w-full border p-2 rounded" 
              onChange={handleFileChange} 
            />
            {formData.profilePhoto && (
              <div className="mt-2">
                <img 
                  src={formData.profilePhoto instanceof File ? URL.createObjectURL(formData.profilePhoto) : formData.profilePhoto}
                  alt="Profile preview"
                  className="w-32 h-32 rounded-full object-cover"
                />
              </div>
            )}
          </div>

          <div>
            <label htmlFor="coverPhoto" className="block text-sm font-medium text-gray-700 mb-1">
              Cover Photo
            </label>
            <input 
              id="coverPhoto"
              type="file" 
              name="coverPhoto" 
              accept="image/*"
              className="w-full border p-2 rounded" 
              onChange={handleFileChange} 
            />
            {formData.coverPhoto && (
              <div className="mt-2">
                <img 
                  src={formData.coverPhoto instanceof File ? URL.createObjectURL(formData.coverPhoto) : formData.coverPhoto}
                  alt="Cover preview"
                  className="w-full h-48 object-cover rounded"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateProfile;
