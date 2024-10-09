
// import React from "react";
// import { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import '../index.css'; 

// export default function Signup() {
//   const [formData, setFormData] = useState({
//     email: '',
//     password: '',
//     backupEmail: '',  // Optional backup email
//     multisigEnabled: false,  // Multisig configuration option
//     multisigSigners: '',  // Comma-separated signers for multisig
//     threshold: 2,  // Threshold for multisig approvals
//     willEnabled: false,  // Toggle will configuration visibility
//     beneficiaries: [{ public_key: '', percentage: '' }],  // List of beneficiaries for the will
//     willSigners: '',  // Comma-separated list of signers for the will
//     willThreshold: 2,  // Number of approvals required for the will
//     willDuration: 6  // Duration in months before the will can be executed
//   });
  
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   // Handle form field changes
//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.id]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
//     });
//   };

//   // Handle beneficiaries field change
//   const handleBeneficiaryChange = (index, e) => {
//     const updatedBeneficiaries = [...formData.beneficiaries];
//     updatedBeneficiaries[index][e.target.name] = e.target.value;
//     setFormData({
//       ...formData,
//       beneficiaries: updatedBeneficiaries,
//     });
//   };

//   // Add a new beneficiary
//   const addBeneficiary = () => {
//     setFormData({
//       ...formData,
//       beneficiaries: [...formData.beneficiaries, { public_key: '', percentage: '' }],
//     });
//   };

//   // Handle form submission
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     // Construct payload to send to the backend
//     const payload = {
//       email: formData.email,
//       password: formData.password,
//       backup_email: formData.backupEmail || undefined,  // Optional
//       multisig: formData.multisigEnabled
//         ? {
//             signers: formData.multisigSigners.split(',').map(signer => signer.trim()),
//             threshold: parseInt(formData.threshold),  // Convert to integer
//           }
//         : undefined,  // Optional multisig
//       will: formData.willEnabled
//         ? {
//             beneficiaries: formData.beneficiaries.map(beneficiary => ({
//               public_key: beneficiary.public_key,
//               percentage: parseFloat(beneficiary.percentage),
//             })),
//             signers: formData.willSigners.split(',').map(signer => signer.trim()),
//             threshold: parseInt(formData.willThreshold),
//             duration_months: parseInt(formData.willDuration),
//           }
//         : undefined,  
//     };

//     try {
//       setLoading(true);
//       const res = await fetch('http://localhost:8000/signup', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(payload),
//       });
//       const data = await res.json();
//       console.log(data);

//       if (!data.status || data.status !== 'Signup successful') {
//         setLoading(false);
//         setError(data.error || 'Signup failed. Try again.');
//         return;
//       }

//       setLoading(false);
//       setError(null);
//       navigate('/sign-in');
//     } catch (error) {
//       setLoading(false);
//       setError(error.message);
//     }
//   };

//   return (
//     <div className='p-3 max-w-lg mx-auto'>
//       <h1 className='text-3xl text-center text-white font-semibold my-7'>Sign Up</h1>
//       <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
//         <input
//           type='email'
//           placeholder='Email'
//           className='border p-3 rounded-lg'
//           id='email'
//           onChange={handleChange}
//           required
//         />
//         <input
//           type='password'
//           placeholder='Password'
//           className='border p-3 rounded-lg'
//           id='password'
//           onChange={handleChange}
//           required
//         />

//         {/* Optional Backup Email */}
//         <input
//           type='email'
//           placeholder='Backup Email (optional)'
//           className='border p-3 rounded-lg'
//           id='backupEmail'
//           onChange={handleChange}
//         />

//         {/* Multisig Configuration */}
//         <div className='flex items-center gap-2'>
//           <input
//             type='checkbox'
//             id='multisigEnabled'
//             onChange={handleChange}
//             checked={formData.multisigEnabled}
//           />
//           <label htmlFor='multisigEnabled' className="text-white">Enable Multisig</label>
//         </div>

//         {formData.multisigEnabled && (
//           <>
//             <input
//               type='text'
//               placeholder='Comma-separated signer public keys'
//               className='border p-3 rounded-lg'
//               id='multisigSigners'
//               onChange={handleChange}
//             />
//             <input
//               type='number'
//               placeholder='Approval Threshold'
//               className='border p-3 rounded-lg'
//               id='threshold'
//               onChange={handleChange}
//               value={formData.threshold}
//               min={1}
//             />
//           </>
//         )}

//         {/* Will Configuration */}
//         <div className='flex items-center gap-2'>
//           <input
//             type='checkbox'
//             id='willEnabled'
//             onChange={handleChange}
//             checked={formData.willEnabled}
//           />
//           <label htmlFor='willEnabled' className="text-white">Add Will Configuration</label>
//         </div>

//         {formData.willEnabled && (
//           <>
//             {/* Will Beneficiaries */}
//             <h3 className='text-xl font-semibold'>Beneficiaries</h3>
//             {formData.beneficiaries.map((beneficiary, index) => (
//               <div key={index} className='flex gap-2'>
//                 <input
//                   type='text'
//                   name='public_key'
//                   placeholder='Beneficiary Public Key'
//                   className='border p-3 rounded-lg flex-1'
//                   value={beneficiary.public_key}
//                   onChange={(e) => handleBeneficiaryChange(index, e)}
//                   required
//                 />
//                 <input
//                   type='number'
//                   name='percentage'
//                   placeholder='Percentage'
//                   className='border p-3 rounded-lg w-24'
//                   value={beneficiary.percentage}
//                   onChange={(e) => handleBeneficiaryChange(index, e)}
//                   required
//                   min={1}
//                   max={100}
//                 />
//               </div>
//             ))}
//             <button
//               type='button'
//               className='text-blue-700 mt-2'
//               onClick={addBeneficiary}
//             >
//               Add Another Beneficiary
//             </button>

//             {/* Will Signers */}
//             <input
//               type='text'
//               placeholder='Comma-separated signer public keys'
//               className='border p-3 rounded-lg mt-4'
//               id='willSigners'
//               onChange={handleChange}
//               value={formData.willSigners}
//               required
//             />
            
//             {/* Will Threshold */}
//             <input
//               type='number'
//               placeholder='Approval Threshold'
//               className='border p-3 rounded-lg'
//               id='willThreshold'
//               onChange={handleChange}
//               value={formData.willThreshold}
//               required
//               min={1}
//             />

//             {/* Will Duration (Months) */}
//             <input
//               type='number'
//               placeholder='Duration in months before execution'
//               className='border p-3 rounded-lg'
//               id='willDuration'
//               onChange={handleChange}
//               value={formData.willDuration}
//               required
//               min={1}
//             />
//           </>
//         )}

//         <button
//           disabled={loading}
//           className='bg-slate-700 text-white p-3 rounded-lg uppercase hover:opacity-95 disabled:opacity-80'
//         >
//           {loading ? 'Loading...' : 'Sign Up'}
//         </button>
//       </form>
      
//       <div className='flex gap-2 mt-5'>
//         <p>Have an account?</p>
//         <Link to={'/sign-in'}>
//           <span className='text-blue-700'>Sign in</span>
//         </Link>
//       </div>
      
//       {error && <p className='text-red-500 mt-5'>{error}</p>}
//     </div>
//   );
// }


// import React, { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import '../index.css'; 

// export default function Signup() {
//   const [formData, setFormData] = useState({
//     email: '',
//     password: '',
//     backupEmail: '',
//     multisigEnabled: false,
//     multisigSigners: [''], 
//     threshold: 2,
//     willEnabled: false,
//     beneficiaries: [{ public_key: '', percentage: '' }],
//     willSigners: [''], 
//     willThreshold: 2,
//     willDuration: 6
//   });
  
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.id]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
//     });
//   };

//   const handleBeneficiaryChange = (index, e) => {
//     const updatedBeneficiaries = [...formData.beneficiaries];
//     updatedBeneficiaries[index][e.target.name] = e.target.value;
//     setFormData({
//       ...formData,
//       beneficiaries: updatedBeneficiaries,
//     });
//   };

//   const handleSignerChange = (type, index, e) => {
//     const updatedSigners = [...formData[type]];
//     updatedSigners[index] = e.target.value;
//     setFormData({
//       ...formData,
//       [type]: updatedSigners,
//     });
//   };

//   const addBeneficiary = () => {
//     setFormData({
//       ...formData,
//       beneficiaries: [...formData.beneficiaries, { public_key: '', percentage: '' }],
//     });
//   };

//   const addSigner = (type) => {
//     setFormData({
//       ...formData,
//       [type]: [...formData[type], ''],
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     const payload = {
//       email: formData.email,
//       password: formData.password,
//       backup_email: formData.backupEmail || undefined,
//       multisig: formData.multisigEnabled
//         ? {
//             signers: formData.multisigSigners.filter(Boolean),
//             threshold: parseInt(formData.threshold),
//           }
//         : undefined,
//       will: formData.willEnabled
//         ? {
//             beneficiaries: formData.beneficiaries.map(beneficiary => ({
//               public_key: beneficiary.public_key,
//               percentage: parseFloat(beneficiary.percentage),
//             })),
//             signers: formData.willSigners.filter(Boolean),
//             threshold: parseInt(formData.willThreshold),
//             duration_months: parseInt(formData.willDuration),
//           }
//         : undefined,
//     };

//     try {
//       setLoading(true);
//       const res = await fetch('http://localhost:8000/signup', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(payload),
//       });
//       const data = await res.json();

//       if (!data.status || data.status !== 'Signup successful') {
//         setLoading(false);
//         setError(data.error || 'Signup failed. Try again.');
//         return;
//       }

//       setLoading(false);
//       setError(null);
//       navigate('/sign-in');
//     } catch (error) {
//       setLoading(false);
//       setError(error.message);
//     }
//   };

//   return (
//     <div className="p-6 max-w-lg mx-auto bg-gray-900 rounded-lg shadow-xl border border-gray-700" style={{background: 'linear-gradient(145deg, #2c2c2c, #1a1a1a)', boxShadow: '10px 10px 20px #101010, -10px -10px 20px #333333'}}>
//       <h1 className="text-5xl text-center text-purple-500 font-bold mb-8" style={{fontFamily: '"Montserrat", sans-serif'}}>Create Your Account</h1>
      
//       <form onSubmit={handleSubmit} className="flex flex-col gap-6">
//         {/* Email and Password */}
//         <input
//           type="email"
//           placeholder="Enter your email"
//           className="bg-gray-800 border border-gray-600 text-white p-3 rounded-lg focus:ring focus:ring-purple-500 focus:border-purple-400 transition-all"
//           id="email"
//           onChange={handleChange}
//           required
//         />
//         <input
//           type="password"
//           placeholder="Choose a strong password"
//           className="bg-gray-800 border border-gray-600 text-white p-3 rounded-lg focus:ring focus:ring-purple-500 focus:border-purple-400 transition-all"
//           id="password"
//           onChange={handleChange}
//           required
//         />

//         {/* Optional Backup Email */}
//         <input
//           type="email"
//           placeholder="Backup Email (optional)"
//           className="bg-gray-800 border border-gray-600 text-white p-3 rounded-lg focus:ring focus:ring-purple-500 focus:border-purple-400 transition-all"
//           id="backupEmail"
//           onChange={handleChange}
//         />

//         {/* Multisig Configuration */}
//         <div className="flex items-center gap-2">
//           <input
//             type="checkbox"
//             id="multisigEnabled"
//             onChange={handleChange}
//             checked={formData.multisigEnabled}
//             className="h-5 w-5 text-purple-500"
//           />
//           <label htmlFor="multisigEnabled" className="text-white text-lg">Enable Multisig</label>
//         </div>

//         {formData.multisigEnabled && (
//           <>
//             <h3 className="text-2xl font-semibold text-purple-500">Multisig Signers</h3>
//             {formData.multisigSigners.map((signer, index) => (
//               <div key={index} className="flex gap-2">
//                 <input
//                   type="text"
//                   placeholder="Signer Public Key"
//                   className="bg-gray-800 border border-gray-600 text-white p-3 rounded-lg flex-1 focus:ring focus:ring-purple-500 focus:border-purple-400 transition-all"
//                   value={signer}
//                   onChange={(e) => handleSignerChange('multisigSigners', index, e)}
//                 />
//               </div>
//             ))}
//             <button
//               type="button"
//               className="text-purple-400 hover:underline"
//               onClick={() => addSigner('multisigSigners')}
//             >
//               + Add Another Signer
//             </button>
//             <input
//               type="number"
//               placeholder="Approval Threshold"
//               className="bg-gray-800 border border-gray-600 text-white p-3 rounded-lg mt-4 focus:ring focus:ring-purple-500 focus:border-purple-400 transition-all"
//               id="threshold"
//               onChange={handleChange}
//               value={formData.threshold}
//               min={1}
//             />
//           </>
//         )}

//         {/* Will Configuration */}
//         <div className="flex items-center gap-2">
//           <input
//             type="checkbox"
//             id="willEnabled"
//             onChange={handleChange}
//             checked={formData.willEnabled}
//             className="h-5 w-5 text-purple-500"
//           />
//           <label htmlFor="willEnabled" className="text-white text-lg">Add Will Configuration</label>
//         </div>

//         {formData.willEnabled && (
//           <>
//             <h3 className="text-2xl font-semibold text-purple-500">Beneficiaries</h3>
//             {formData.beneficiaries.map((beneficiary, index) => (
//               <div key={index} className="flex gap-2">
//                 <input
//                   type="text"
//                   name="public_key"
//                   placeholder="Beneficiary Public Key"
//                   className="bg-gray-800 border border-gray-600 text-white p-3 rounded-lg flex-1 focus:ring focus:ring-purple-500 focus:border-purple-400 transition-all"
//                   value={beneficiary.public_key}
//                   onChange={(e) => handleBeneficiaryChange(index, e)}
//                   required
//                 />
//                 <input
//                   type="number"
//                   name="percentage"
//                   placeholder="Percentage"
//                   className="bg-gray-800 border border-gray-600 text-white p-3 rounded-lg w-24 focus:ring focus:ring-purple-500 focus:border-purple-400 transition-all"
//                   value={beneficiary.percentage}
//                   onChange={(e) => handleBeneficiaryChange(index, e)}
//                   required
//                   min={1}
//                   max={100}
//                 />
//               </div>
//             ))}
//             <button
//               type="button"
//               className="text-purple-400 hover:underline mt-2"
//               onClick={addBeneficiary}
//             >
//               + Add Another Beneficiary
//             </button>

//             <h3 className="text-2xl font-semibold text-purple-500 mt-5">Will Signers</h3>
//             {formData.willSigners.map((signer, index) => (
//               <div key={index} className="flex gap-2">
//                 <input
//                   type="text"
//                   placeholder="Signer Public Key"
//                   className="bg-gray-800 border border-gray-600 text-white p-3 rounded-lg flex-1 focus:ring focus:ring-purple-500 focus:border-purple-400 transition-all"
//                   value={signer}
//                   onChange={(e) => handleSignerChange('willSigners', index, e)}
//                 />
//               </div>
//             ))}
//             <button
//               type="button"
//               className="text-purple-400 hover:underline mt-2"
//               onClick={() => addSigner('willSigners')}
//             >
//               + Add Another Will Signer
//             </button>

//             <input
//               type="number"
//               placeholder="Approval Threshold"
//               className="bg-gray-800 border border-gray-600 text-white p-3 rounded-lg mt-4 focus:ring focus:ring-purple-500 focus:border-purple-400 transition-all"
//               id="willThreshold"
//               onChange={handleChange}
//               value={formData.willThreshold}
//               required
//               min={1}
//             />

//             <input
//               type="number"
//               placeholder="Duration in months before execution"
//               className="bg-gray-800 border border-gray-600 text-white p-3 rounded-lg mt-4 focus:ring focus:ring-purple-500 focus:border-purple-400 transition-all"
//               id="willDuration"
//               onChange={handleChange}
//               value={formData.willDuration}
//               required
//               min={1}
//             />
//           </>
//         )}

//         <button
//           disabled={loading}
//           className="bg-purple-600 text-white p-3 rounded-lg uppercase hover:bg-purple-700 transition-all disabled:opacity-50 mt-4 shadow-lg"
//         >
//           {loading ? 'Loading...' : 'Sign Up'}
//         </button>
//       </form>
      
//       <div className="flex gap-2 mt-5 text-white">
//         <p>Have an account?</p>
//         <Link to={'/sign-in'}>
//           <span className="text-purple-400 hover:underline">Sign in</span>
//         </Link>
//       </div>
      
//       {error && <p className="text-purple-500 mt-5">{error}</p>}
//     </div>
//   );
// }


import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import '../index.css'; 

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    backupEmail: '',
    multisigEnabled: false,
    multisigEmails: [''],  // Now we use emails instead of public keys for signers
    threshold: 2,
    willEnabled: false,
    beneficiaries: [{ email: '', percentage: '' }],  // Now we use emails instead of public keys for beneficiaries
    willEmails: [''],  // Will signers are also using emails now
    willThreshold: 2,
    willDuration: 6
  });
  
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Function to fetch the public key based on email
  const fetchPublicKey = async (email) => {
    try {
      const res = await fetch(`http://localhost:8000/user?email=${email}`);
      const data = await res.json();
      if (data.public_key) {
        return data.public_key;
      } else {
        throw new Error("User not found");
      }
    } catch (err) {
      setError(`Failed to fetch public key for ${email}: ${err.message}`);
      return null;
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    });
  };

  const handleBeneficiaryChange = (index, e) => {
    const updatedBeneficiaries = [...formData.beneficiaries];
    updatedBeneficiaries[index][e.target.name] = e.target.value;
    setFormData({
      ...formData,
      beneficiaries: updatedBeneficiaries,
    });
  };

  const handleSignerChange = (type, index, e) => {
    const updatedSigners = [...formData[type]];
    updatedSigners[index] = e.target.value;
    setFormData({
      ...formData,
      [type]: updatedSigners,
    });
  };

  const addBeneficiary = () => {
    setFormData({
      ...formData,
      beneficiaries: [...formData.beneficiaries, { email: '', percentage: '' }],
    });
  };

  const addSigner = (type) => {
    setFormData({
      ...formData,
      [type]: [...formData[type], ''],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    const payload = {
      email: formData.email,
      password: formData.password,
      backup_email: formData.backupEmail || undefined,
      multisig: undefined,
      will: undefined,
    };

    // Fetch public keys for signers (multisig)
    if (formData.multisigEnabled) {
      const signers = [];
      for (const email of formData.multisigEmails.filter(Boolean)) {
        const publicKey = await fetchPublicKey(email);
        if (publicKey) signers.push(publicKey);
      }
      payload.multisig = {
        signers,
        threshold: parseInt(formData.threshold),
      };
    }

    // Fetch public keys for will beneficiaries and signers
    if (formData.willEnabled) {
      const beneficiaries = [];
      for (const beneficiary of formData.beneficiaries) {
        const publicKey = await fetchPublicKey(beneficiary.email);
        if (publicKey) {
          beneficiaries.push({
            public_key: publicKey,
            percentage: parseFloat(beneficiary.percentage),
          });
        }
      }

      const willSigners = [];
      for (const email of formData.willEmails.filter(Boolean)) {
        const publicKey = await fetchPublicKey(email);
        if (publicKey) willSigners.push(publicKey);
      }

      payload.will = {
        beneficiaries,
        signers: willSigners,
        threshold: parseInt(formData.willThreshold),
        duration_months: parseInt(formData.willDuration),
      };
    }

    try {
      const res = await fetch('http://localhost:8000/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!data.status || data.status !== 'Signup successful') {
        setLoading(false);
        setError(data.error || 'Signup failed. Try again.');
        return;
      }

      setLoading(false);
      setError(null);
      navigate('/sign-in');
    } catch (error) {
      setLoading(false);
      setError(error.message);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-gray-900 rounded-lg shadow-xl border border-gray-700" style={{background: 'linear-gradient(145deg, #2c2c2c, #1a1a1a)', boxShadow: '10px 10px 20px #101010, -10px -10px 20px #333333'}}>
      <h1 className="text-5xl text-center text-purple-500 font-bold mb-8" style={{fontFamily: '"Montserrat", sans-serif'}}>Create Your Account</h1>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Email and Password */}
        <input
          type="email"
          placeholder="Enter your email"
          className="bg-gray-800 border border-gray-600 text-white p-3 rounded-lg focus:ring focus:ring-purple-500 focus:border-purple-400 transition-all"
          id="email"
          onChange={handleChange}
          required
        />
        <input
          type="password"
          placeholder="Choose a strong password"
          className="bg-gray-800 border border-gray-600 text-white p-3 rounded-lg focus:ring focus:ring-purple-500 focus:border-purple-400 transition-all"
          id="password"
          onChange={handleChange}
          required
        />

        {/* Optional Backup Email */}
        <input
          type="email"
          placeholder="Backup Email (optional)"
          className="bg-gray-800 border border-gray-600 text-white p-3 rounded-lg focus:ring focus:ring-purple-500 focus:border-purple-400 transition-all"
          id="backupEmail"
          onChange={handleChange}
        />

        {/* Multisig Configuration */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="multisigEnabled"
            onChange={handleChange}
            checked={formData.multisigEnabled}
            className="h-5 w-5 text-purple-500"
          />
          <label htmlFor="multisigEnabled" className="text-white text-lg">Enable Multisig</label>
        </div>

        {formData.multisigEnabled && (
          <>
            <h3 className="text-2xl font-semibold text-purple-500">Multisig Signers</h3>
            {formData.multisigEmails.map((email, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="email"
                  placeholder="Signer Email"
                  className="bg-gray-800 border border-gray-600 text-white p-3 rounded-lg flex-1 focus:ring focus:ring-purple-500 focus:border-purple-400 transition-all"
                  value={email}
                  onChange={(e) => handleSignerChange('multisigEmails', index, e)}
                />
              </div>
            ))}
            <button
              type="button"
              className="text-purple-400 hover:underline"
              onClick={() => addSigner('multisigEmails')}
            >
              + Add Another Signer
            </button>
            <input
              type="number"
              placeholder="Approval Threshold"
              className="bg-gray-800 border border-gray-600 text-white p-3 rounded-lg mt-4 focus:ring focus:ring-purple-500 focus:border-purple-400 transition-all"
              id="threshold"
              onChange={handleChange}
              value={formData.threshold}
              min={1}
            />
          </>
        )}

        {/* Will Configuration */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="willEnabled"
            onChange={handleChange}
            checked={formData.willEnabled}
            className="h-5 w-5 text-purple-500"
          />
          <label htmlFor="willEnabled" className="text-white text-lg">Add Will Configuration</label>
        </div>

        {formData.willEnabled && (
          <>
            <h3 className="text-2xl font-semibold text-purple-500">Beneficiaries</h3>
            {formData.beneficiaries.map((beneficiary, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="email"
                  name="email"
                  placeholder="Beneficiary Email"
                  className="bg-gray-800 border border-gray-600 text-white p-3 rounded-lg flex-1 focus:ring focus:ring-purple-500 focus:border-purple-400 transition-all"
                  value={beneficiary.email}
                  onChange={(e) => handleBeneficiaryChange(index, e)}
                  required
                />
                <input
                  type="number"
                  name="percentage"
                  placeholder="Percentage"
                  className="bg-gray-800 border border-gray-600 text-white p-3 rounded-lg w-24 focus:ring focus:ring-purple-500 focus:border-purple-400 transition-all"
                  value={beneficiary.percentage}
                  onChange={(e) => handleBeneficiaryChange(index, e)}
                  required
                  min={1}
                  max={100}
                />
              </div>
            ))}
            <button
              type="button"
              className="text-purple-400 hover:underline mt-2"
              onClick={addBeneficiary}
            >
              + Add Another Beneficiary
            </button>

            <h3 className="text-2xl font-semibold text-purple-500 mt-5">Will Signers</h3>
            {formData.willEmails.map((email, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="email"
                  placeholder="Signer Email"
                  className="bg-gray-800 border border-gray-600 text-white p-3 rounded-lg flex-1 focus:ring focus:ring-purple-500 focus:border-purple-400 transition-all"
                  value={email}
                  onChange={(e) => handleSignerChange('willEmails', index, e)}
                />
              </div>
            ))}
            <button
              type="button"
              className="text-purple-400 hover:underline mt-2"
              onClick={() => addSigner('willEmails')}
            >
              + Add Another Will Signer
            </button>

            <input
              type="number"
              placeholder="Approval Threshold"
              className="bg-gray-800 border border-gray-600 text-white p-3 rounded-lg mt-4 focus:ring focus:ring-purple-500 focus:border-purple-400 transition-all"
              id="willThreshold"
              onChange={handleChange}
              value={formData.willThreshold}
              required
              min={1}
            />

            <input
              type="number"
              placeholder="Duration in months before execution"
              className="bg-gray-800 border border-gray-600 text-white p-3 rounded-lg mt-4 focus:ring focus:ring-purple-500 focus:border-purple-400 transition-all"
              id="willDuration"
              onChange={handleChange}
              value={formData.willDuration}
              required
              min={1}
            />
          </>
        )}

        <button
          disabled={loading}
          className="bg-purple-600 text-white p-3 rounded-lg uppercase hover:bg-purple-700 transition-all disabled:opacity-50 mt-4 shadow-lg"
        >
          {loading ? 'Loading...' : 'Sign Up'}
        </button>
      </form>
      
      <div className="flex gap-2 mt-5 text-white">
        <p>Have an account?</p>
        <Link to={'/sign-in'}>
          <span className="text-purple-400 hover:underline">Sign in</span>
        </Link>
      </div>
      
      {error && <p className="text-purple-500 mt-5">{error}</p>}
    </div>
  );
}
