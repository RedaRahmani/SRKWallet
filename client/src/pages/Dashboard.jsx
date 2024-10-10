import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [balance, setBalance] = useState('Loading...');
  const [copyMessage, setCopyMessage] = useState('Copy');
  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    const key = localStorage.getItem('publicKey');
    if (!email || !key) {
      navigate('/sign-in');
    } else {
      setUserEmail(email);
      setPublicKey(key);
    }

    async function fetchBalance() {
      try {
        const res = await fetch('http://localhost:8000/balance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${Cookies.get('token')}`,
          },
          body: JSON.stringify({ email: userEmail }),
        });
        const data = await res.json();
        setBalance(data.balance || '0 SOL');
      } catch (err) {
        console.error('Error fetching balance:', err);
        setBalance('Error loading balance');
      }
    }
    fetchBalance();
  }, [navigate, userEmail]);

  const handleSignOut = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('publicKey');
    navigate('/sign-in');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(publicKey)
      .then(() => {
        setCopyMessage('Copied!');
        setTimeout(() => setCopyMessage('Copy'), 2000);
      })
      .catch(() => {
        setCopyMessage('Failed to copy');
        setTimeout(() => setCopyMessage('Copy'), 2000);
      });
  };
  const handleFreezeAccount = async () => {
    try {
      const res = await fetch('http://localhost:8000/freeze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Cookies.get('token')}`,
        },
        body: JSON.stringify({ email: userEmail }),
      });
      const data = await res.json();
      if (data.status === 'Account frozen for 12 hours and user signed out.') {
        alert('Account has been frozen for 12 hours. You have been signed out.');
        handleSignOut(); // Sign out the user after freezing the account
      } else {
        alert('Error freezing account: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error freezing account:', err);
      alert('Error freezing account');
    }
  };

  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center" style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="max-w-6xl w-full bg-white/5 p-10 rounded-xl shadow-xl backdrop-blur-lg" style={{ boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.5)' }}>
        <h1 className="text-4xl text-center text-white font-bold mb-8" style={{ fontFamily: '"Roboto", sans-serif' }}>
          Welcome to Your Dashboard
        </h1>

        {/* User Info */}
        <div className="bg-white/10 p-6 rounded-lg mb-8 flex flex-col md:flex-row items-center justify-between text-white">
          <div>
            <h2 className="text-xl font-semibold mb-2">Hello, {userEmail}</h2>
            <p className="text-lg"><strong>Balance:</strong> {balance}</p>
          </div>
          <div className="flex items-center mt-4 md:mt-0">
            <p className="mr-3"><strong>Public Key:</strong> {publicKey}</p>
            <button
              onClick={copyToClipboard}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg transition-transform duration-300 hover:scale-105"
            >
              {copyMessage}
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Link to="/transfer" className="bg-gray-800/50 p-6 rounded-lg text-white hover:bg-gray-900/80 transition-colors duration-300">
            <h3 className="text-2xl font-semibold mb-2">Transfer Funds</h3>
            <p className="text-sm">Send or receive SOL quickly.</p>
          </Link>

          <div
            onClick={handleFreezeAccount}
            className="bg-gray-800/50 p-6 rounded-lg text-white hover:bg-gray-900/80 transition-colors duration-300 cursor-pointer"
          >
            <h3 className="text-2xl font-semibold mb-2">Freeze Account</h3>
            <p className="text-sm">Freeze your account for 12 hours.</p>
          </div>

          <Link to="/transaction-history" className="bg-gray-800/50 p-6 rounded-lg text-white hover:bg-gray-900/80 transition-colors duration-300">
            <h3 className="text-2xl font-semibold mb-2">Transaction History</h3>
            <p className="text-sm">View all past transactions.</p>
          </Link>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="mt-8 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-transform duration-300 w-full"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
