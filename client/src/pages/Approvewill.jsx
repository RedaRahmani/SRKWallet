// import React, { useState } from 'react';
// import Cookies from 'js-cookie';

// export default function ApproveWill() {
//   const [email, setEmail] = useState('');
//   const [executorPublicKey, setExecutorPublicKey] = useState('');
//   const [error, setError] = useState(null);
//   const [success, setSuccess] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const handleApprove = async () => {
//     setLoading(true);
//     setError(null);

//     try {
//       const res = await fetch('http://localhost:8000/approve_will', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${Cookies.get('token')}`,
//         },
//         body: JSON.stringify({ email, executor_public_key: executorPublicKey }),
//       });

//       const data = await res.json();

//       if (data.error) {
//         setError(data.error);
//       } else {
//         setSuccess('Will approved successfully!');
//       }
//     } catch (err) {
//       setError('Failed to approve the will');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="p-6 max-w-4xl mx-auto">
//       <h1 className="text-3xl font-bold mb-6 text-center">Approve Will</h1>
//       <div className="mb-4">
//         <input
//           type="text"
//           placeholder="User Email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           className="border p-3 rounded-lg w-full"
//           required
//         />
//       </div>
//       <div className="mb-4">
//         <input
//           type="text"
//           placeholder="Your Executor Public Key"
//           value={executorPublicKey}
//           onChange={(e) => setExecutorPublicKey(e.target.value)}
//           className="border p-3 rounded-lg w-full"
//           required
//         />
//       </div>

//       <button
//         onClick={handleApprove}
//         disabled={loading}
//         className="bg-blue-600 text-white py-2 px-4 rounded-lg"
//       >
//         {loading ? 'Approving...' : 'Approve Will'}
//       </button>

//       {success && <p className="text-green-500 mt-4">{success}</p>}
//       {error && <p className="text-red-500 mt-4">{error}</p>}
//     </div>
//   );
// }
import React, { useState } from 'react';
import Cookies from 'js-cookie';
import { FaEnvelope, FaKey, FaCheckCircle, FaTimesCircle } from 'react-icons/fa'; // Import icons

export default function ApproveWill() {
  const [email, setEmail] = useState('');
  const [executorPublicKey, setExecutorPublicKey] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    if (!email || !executorPublicKey) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('http://localhost:8000/approve_will', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Cookies.get('token')}`,
        },
        body: JSON.stringify({ email, executor_public_key: executorPublicKey }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setSuccess('Will approved successfully!');
      }
    } catch (err) {
      setError('Failed to approve the will');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto  text-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-center">Approve Will</h1>

      {/* Email Input */}
      <div className="mb-4">
        <label className="block text-lg mb-2" htmlFor="email">User Email</label>
        <div className="flex items-center bg-gray-700 rounded-lg p-2">
          <FaEnvelope className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="User Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-700 text-white focus:outline-none p-2"
            required
          />
        </div>
      </div>

      {/* Executor Public Key Input */}
      <div className="mb-4">
        <label className="block text-lg mb-2" htmlFor="executorPublicKey">Executor Public Key</label>
        <div className="flex items-center bg-gray-700 rounded-lg p-2">
          <FaKey className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Your Executor Public Key"
            value={executorPublicKey}
            onChange={(e) => setExecutorPublicKey(e.target.value)}
            className="w-full bg-gray-700 text-white focus:outline-none p-2"
            required
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleApprove}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg w-full transition-colors"
      >
        {loading ? 'Approving...' : 'Approve Will'}
      </button>

      {/* Success Message */}
      {success && (
        <div className="mt-4 p-4 bg-green-800 text-green-200 rounded-lg flex items-center">
          <FaCheckCircle className="mr-2" />
          <span>{success}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-800 text-red-200 rounded-lg flex items-center">
          <FaTimesCircle className="mr-2" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
