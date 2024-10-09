import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { FaCheckCircle, FaTimesCircle, FaVoteYea, FaSpinner } from 'react-icons/fa'; // Import icons
import '../index.css'; // Ensure animations are in your CSS file

export default function Vote() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      const email = localStorage.getItem('userEmail');
      if (!email) {
        setError('User email not found');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:8000/transactions?email=${email}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${Cookies.get('token')}`,
          },
        });
        const data = await response.json();

        if (data.error) {
          setError(data.error);
        } else {
          const updatedTransactions = data.transactions.map((transaction) => {
            return {
              ...transaction,
              id: transaction._id.$oid, // Extracting the ObjectID as string
            };
          });
          setTransactions(updatedTransactions);
        }
      } catch (err) {
        setError('Failed to fetch transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const handleVote = async (transactionId, approve) => {
    try {
      const publicKey = localStorage.getItem('publicKey');
  
      if (!publicKey) {
        console.error('Signer public key not found in localStorage.');
        alert('Signer public key not found.');
        return;
      }
  
      const res = await fetch('http://localhost:8000/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Cookies.get('token')}`,
        },
        body: JSON.stringify({
          transfer_id: transactionId,
          signer_public_key: publicKey,
          approve: approve,
        }),
      });
  
      const data = await res.json();
      if (data.error) {
        alert(`Failed to vote: ${data.error}`);
      } else {
        alert('Vote recorded successfully');
      }
    } catch (err) {
      console.error('Error submitting vote:', err);
      alert('Failed to submit the vote. Please try again.');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center flex items-center justify-center space-x-3 fade-in">
        <FaVoteYea className="text-purple-500" /> 
        <span>Pending Transactions for Voting</span>
      </h1>

      {loading ? (
        <div className="flex items-center justify-center">
          <FaSpinner className="animate-spin text-4xl text-purple-500" />
          <p className="ml-3 text-lg text-purple-500">Loading transactions...</p>
        </div>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : transactions.length === 0 ? (
        <p className="text-center text-gray-700">No transactions awaiting approval.</p>
      ) : (
        transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="bg-gray-800 text-white shadow-lg rounded-lg p-6 mb-6 slide-in"
          >
            <p className="font-semibold mb-2">Transaction ID: 
              <span className="text-blue-400"> {transaction.id}</span>
            </p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <p>Sender: {transaction.sender}</p>
              <p>Recipient: {transaction.recipient}</p>
              <p>Amount: {transaction.amount} SOL</p>
              <p>Signers: {transaction.signers.join(', ')}</p>
              <p>Threshold: {transaction.threshold}</p>
              <p>Status: 
                <span className="ml-2 font-semibold text-yellow-400">{transaction.status}</span>
              </p>
            </div>

            <div className="flex justify-between mt-4">
              <button
                onClick={() => handleVote(transaction.id, true)}
                className="bg-green-500 flex items-center text-white py-2 px-4 rounded hover:bg-green-600 transition-all hover:scale-105"
              >
                <FaCheckCircle className="mr-2 hover:animate-bounce" />
                Approve
              </button>
              <button
                onClick={() => handleVote(transaction.id, false)}
                className="bg-red-500 flex items-center text-white py-2 px-4 rounded hover:bg-red-600 transition-all hover:scale-105"
              >
                <FaTimesCircle className="mr-2 hover:animate-bounce" />
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
