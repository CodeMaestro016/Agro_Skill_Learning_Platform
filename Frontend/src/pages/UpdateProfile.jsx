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
        // Only store the base64 string temporarily in formData
        setFormData(prev => ({ ...prev, [e.target.name]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
  
    try {
      // Create a new object without the large base64 strings
      const updateData = {
        ...formData,
        // Only include profilePhoto and coverPhoto if they've changed
        profilePhoto: formData.profilePhoto !== user?.profilePhoto ? formData.profilePhoto : undefined,
        coverPhoto: formData.coverPhoto !== user?.coverPhoto ? formData.coverPhoto : undefined
      };

      const response = await fetch('http://localhost:8081/api/user/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });
  
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Update failed');
      }
  
      const updatedUser = await response.json();
      
      // Update the user context with the new data
      updateUser(updatedUser);
      
      // Navigate to home page after successful update
      navigate('/home');
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
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Update Profile</h2>
        
        {/* Error message display */}
        {error && (
          <div className="mb-4 text-red-600">
            <p>{error}</p>
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
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
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
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
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
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
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
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
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
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
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
              className="w-full border p-2 rounded" 
              onChange={handleFileChange} 
            />
            {formData.profilePhoto && (
              <img 
                src={formData.profilePhoto} 
                alt="Profile Preview" 
                className="w-32 h-32 rounded-full mt-2" 
              />
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
              className="w-full border p-2 rounded" 
              onChange={handleFileChange} 
            />
            {formData.coverPhoto && (
              <img 
                src={formData.coverPhoto} 
                alt="Cover Preview" 
                className="w-full h-48 object-cover mt-2 rounded-lg" 
              />
            )}
          </div>

          <button 
            type="submit" 
            className={`w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''}`} 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateProfile;
