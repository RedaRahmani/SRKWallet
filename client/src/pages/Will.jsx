import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { FaUserPlus, FaTrashAlt, FaUser, FaCheckCircle } from 'react-icons/fa'; // Importing icons

export default function Will() {
  const [beneficiaries, setBeneficiaries] = useState([{ publicKey: '', percentage: 0 }]);
  const [signers, setSigners] = useState(['']); // Executors
  const [threshold, setThreshold] = useState(1);
  const [durationMonths, setDurationMonths] = useState(6);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [willData, setWillData] = useState(null);
  
  const userEmail = localStorage.getItem('userEmail'); // Fetch the email from localStorage
  const token = Cookies.get('token');

  // Fetch the will status for the logged-in user
  useEffect(() => {
    const fetchWill = async () => {
      try {
        const res = await fetch(`http://localhost:8000/user?email=${userEmail}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();

        if (data.error) {
          setError(data.error);
        } else {
          setWillData(data.will || null);
        }
      } catch (err) {
        setError('Failed to fetch will information');
      }
    };

    if (userEmail && token) {
      fetchWill();
    }
  }, [userEmail, token]);

  // Handle adding a new beneficiary
  const handleAddBeneficiary = () => {
    setBeneficiaries([...beneficiaries, { publicKey: '', percentage: 0 }]);
  };

  // Handle removing a beneficiary
  const handleRemoveBeneficiary = (index) => {
    const newBeneficiaries = beneficiaries.filter((_, i) => i !== index);
    setBeneficiaries(newBeneficiaries);
  };

  // Handle input changes for beneficiaries and signers
  const handleBeneficiaryChange = (index, field, value) => {
    const newBeneficiaries = beneficiaries.map((beneficiary, i) =>
      i === index ? { ...beneficiary, [field]: value } : beneficiary
    );
    setBeneficiaries(newBeneficiaries);
  };

  const handleSignerChange = (index, value) => {
    const newSigners = signers.map((signer, i) => (i === index ? value : signer));
    setSigners(newSigners);
  };

  // Handle submitting the will form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('http://localhost:8000/add_or_update_will', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: userEmail,  // Send the user email from localStorage
          beneficiaries: beneficiaries.map(b => ({ public_key: b.publicKey, percentage: parseFloat(b.percentage) })), // Send as float
          signers,
          threshold: parseInt(threshold, 10), // Convert threshold to number
          duration_months: parseInt(durationMonths, 10), // Convert duration to number
        }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setStatus('Will created or updated successfully');
      }
    } catch (err) {
      setError('Failed to create or update will');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto  text-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-center">
        <FaUser className="inline mr-2" />Create or Update Your Will
      </h1>

      {willData ? (
        <div className="p-4 bg-green-800 rounded-lg mb-4">
          <h2 className="text-xl font-bold">Will Status: <FaCheckCircle className="inline ml-2 text-green-300" /></h2>
          <p>Your will is currently active with {willData.beneficiaries.length} beneficiaries.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Beneficiaries Section */}
          <h2 className="text-2xl mb-4 font-semibold">Beneficiaries</h2>
          {beneficiaries.map((beneficiary, index) => (
            <div key={index} className="mb-4">
              <input
                type="text"
                placeholder="Beneficiary Public Key"
                value={beneficiary.publicKey}
                onChange={(e) => handleBeneficiaryChange(index, 'publicKey', e.target.value)}
                className="border p-2 rounded-lg mb-2 w-full bg-gray-700"
                required
              />
              <input
                type="number"
                placeholder="Percentage"
                value={beneficiary.percentage}
                onChange={(e) => handleBeneficiaryChange(index, 'percentage', e.target.value)}
                className="border p-2 rounded-lg mb-2 w-full bg-gray-700"
                min="1"
                max="100"
                required
              />
              {beneficiaries.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveBeneficiary(index)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <FaTrashAlt className="inline mr-2" />Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddBeneficiary}
            className="text-blue-500 hover:text-blue-700 transition-colors"
          >
            <FaUserPlus className="inline mr-2" /> Add Another Beneficiary
          </button>

          {/* Signers (Executors) Section */}
          <h2 className="text-2xl mb-4 mt-6 font-semibold">Signers (Executors)</h2>
          {signers.map((signer, index) => (
            <div key={index} className="mb-4">
              <input
                type="text"
                placeholder="Signer Public Key"
                value={signer}
                onChange={(e) => handleSignerChange(index, e.target.value)}
                className="border p-2 rounded-lg mb-2 w-full bg-gray-700"
                required
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setSigners([...signers, ''])}
            className="text-blue-500 hover:text-blue-700 transition-colors"
          >
            <FaUserPlus className="inline mr-2" /> Add Another Signer
          </button>

          {/* Approval Threshold */}
          <div className="mb-4 mt-6">
            <label className="block text-lg mb-2">Approval Threshold</label>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="border p-2 rounded-lg w-full bg-gray-700"
              min="1"
              required
            />
          </div>

          {/* Duration Before Will Execution */}
          <div className="mb-4">
            <label className="block text-lg mb-2">Duration Before Will Execution (Months)</label>
            <input
              type="number"
              value={durationMonths}
              onChange={(e) => setDurationMonths(e.target.value)}
              className="border p-2 rounded-lg w-full bg-gray-700"
              min="1"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg w-full transition-colors"
          >
            {loading ? 'Submitting...' : 'Submit Will'}
          </button>
        </form>
      )}

      {status && <p className="text-green-500 mt-4">{status}</p>}
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
}
