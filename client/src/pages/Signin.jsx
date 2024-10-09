// Signin.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';  // Use Auth Context
import Cookies from 'js-cookie';  // To handle cookies
import '../index.css';

export default function Signin() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();  // Get login from AuthContext

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch('http://localhost:8000/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.error) {
        setLoading(false);
        setError(data.error);
        return;
      }

      // Login using the AuthContext function
      login(data.token);

      localStorage.setItem('userEmail', formData.email);
      localStorage.setItem('token', data.token);

      // Fetch the user's public key from the backend using formData.email
      const userRes = await fetch(`http://localhost:8000/user?email=${formData.email}`, {
        headers: {
          'Authorization': `Bearer ${data.token}`,
        },
      });
      const userData = await userRes.json();

      if (userData.public_key) {
        localStorage.setItem('publicKey', userData.public_key);  // Save public key
      } else {
        throw new Error('Failed to retrieve public key');
      }

      // Redirect to another page after successful sign-in
      setLoading(false);
      setError(null);
      navigate('/dashboard');
    } catch (err) {
      setLoading(false);
      setError('Failed to sign in. Please try again.');
      console.error(err);
    }
  };

  return (
    <div className='p-6 max-w-lg mx-auto mt-20 bg-gray-900 rounded-lg shadow-xl border border-gray-700' style={{ background: 'linear-gradient(145deg, #2c2c2c, #1a1a1a)', boxShadow: '10px 10px 20px #101010, -10px -10px 20px #333333' }}>
      <h1 className='text-5xl text-center text-purple-500 font-bold mb-8' style={{ fontFamily: '"Montserrat", sans-serif' }}>Sign In</h1>
      
      <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
        <input
          type='email'
          placeholder='Enter your email'
          className='bg-gray-800 border border-gray-600 text-white p-3 rounded-lg focus:ring focus:ring-purple-500 focus:border-purple-400 transition-all'
          id='email'
          onChange={handleChange}
          required
        />
        <input
          type='password'
          placeholder='Enter your password'
          className='bg-gray-800 border border-gray-600 text-white p-3 rounded-lg focus:ring focus:ring-purple-500 focus:border-purple-400 transition-all'
          id='password'
          onChange={handleChange}
          required
        />

        <button
          disabled={loading}
          className='bg-purple-600 text-white p-3 rounded-lg uppercase hover:bg-purple-700 transition-all disabled:opacity-50 mt-4 shadow-lg'
        >
          {loading ? 'Loading...' : 'Sign In'}
        </button>
      </form>

      <div className='flex gap-2 text-white mt-5'>
        <p>Don't have an account?</p>
        <Link to='/sign-up'>
          <span className='text-purple-400 hover:underline'>Sign up</span>
        </Link>
      </div>

      {error && <p className='text-purple-500 mt-5'>{error}</p>}
    </div>
  );
}
