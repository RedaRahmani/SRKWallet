// import React, { useState, useEffect } from 'react';
// import Cookies from 'js-cookie';
// import { useNavigate } from 'react-router-dom';
// import { FaWallet, FaBalanceScale, FaArrowCircleRight } from 'react-icons/fa';  // Importing Icons
// import '../index.css';

// export default function Transfer() {
//   const [balance, setBalance] = useState(null);
//   const [supplyInfo, setSupplyInfo] = useState(null);
//   const [formData, setFormData] = useState({
//     recipient: '',
//     sol: '',
//     walletType: 'solana',
//     password: '',
//     depositAmount: '', // For deposit
//   });
//   const [transferId, setTransferId] = useState(null);
//   const [vulnerabilitySummary, setVulnerabilitySummary] = useState(null);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [depositLoading, setDepositLoading] = useState(false);
//   const [balanceLoading, setBalanceLoading] = useState(false);
//   const navigate = useNavigate();

//   // Fetch supply information on page load
//   useEffect(() => {
//     fetchSupply();
//   }, []);

//   // Fetch user balance
//   const fetchBalance = async () => {
//     const userEmail = localStorage.getItem('userEmail');
//     if (!userEmail) {
//       setError('No user email found. Please sign in again.');
//       return;
//     }

//     setBalanceLoading(true);
//     try {
//       const res = await fetch('http://localhost:8000/balance', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${Cookies.get('token')}`,
//         },
//         body: JSON.stringify({ email: userEmail }),
//       });

//       const data = await res.json();
//       if (data.error) {
//         setError(data.error);
//       } else if (data.balance) {
//         setBalance(data.balance);
//       } else {
//         setError('Failed to retrieve balance.');
//       }
//     } catch (err) {
//       setError('Failed to fetch balance');
//     } finally {
//       setBalanceLoading(false);
//     }
//   };

//   // Fetch Solana supply information
//   const fetchSupply = async () => {
//     try {
//       const res = await fetch('http://localhost:8000/supply');
//       const data = await res.json();
//       if (data.error) {
//         setError(data.error);
//       } else {
//         setSupplyInfo(data);
//       }
//     } catch (err) {
//       setError('Failed to fetch supply information');
//     }
//   };

//   // Handle form field changes
//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.id]: e.target.value,
//     });
//   };

//   // Handle transfer form submission
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setVulnerabilitySummary(null);

//     const userEmail = localStorage.getItem('userEmail');
//     const endpoint = formData.walletType === 'solana'
//       ? 'http://localhost:8000/transfer'
//       : 'http://localhost:8000/wormhole_transfer';

//     const payload = formData.walletType === 'solana'
//       ? {
//           sender_email: userEmail,
//           password: formData.password,
//           recipient_public_key: formData.recipient,
//           sol: parseFloat(formData.sol),
//         }
//       : {
//           sender_email: userEmail,
//           password: formData.password,
//           recipient_eth_address: formData.recipient,
//           sol: parseFloat(formData.sol),
//         };

//     try {
//       const res = await fetch(endpoint, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${Cookies.get('token')}`,
//         },
//         body: JSON.stringify(payload),
//       });

//       const data = await res.json();

//       if (data.error) {
//         setError(data.error);
//       } else if (data.vulnerability_summary) {
//         setVulnerabilitySummary(data.vulnerability_summary);
//       } else if (data.transfer_id) {
//         setTransferId(data.transfer_id);
//       } else {
//         alert('Transfer successful!');
//         navigate('/dashboard');
//       }
//     } catch (err) {
//       setError('Failed to process the transfer.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle deposit submission
//   const handleDeposit = async () => {
//     setDepositLoading(true);
//     const userEmail = localStorage.getItem('userEmail');
//     const depositAmount = parseFloat(formData.depositAmount);

//     if (isNaN(depositAmount) || depositAmount <= 0) {
//       setError('Please enter a valid deposit amount.');
//       setDepositLoading(false);
//       return;
//     }

//     try {
//       const res = await fetch('http://localhost:8000/deposit', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${Cookies.get('token')}`,
//         },
//         body: JSON.stringify({ email: userEmail, sol: depositAmount }),
//       });

//       const data = await res.json();
//       if (data.error) {
//         setError(data.error);
//       } else {
//         alert('Deposit successful! Check your balance.');
//         fetchBalance(userEmail);
//       }
//     } catch (err) {
//       setError('Deposit failed.');
//     } finally {
//       setDepositLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen  text-white p-6">
//       {/* Two-Column Grid Layout */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        
//         {/* Left Column: Balance and Supply Info */}
//         <div className="space-y-8">
          
//           {/* Balance Section */}
//           <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-4">
//             <h3 className="text-3xl flex items-center space-x-3 text-purple-500 font-bold">
//               <FaBalanceScale /> <span>Check Balance</span>
//             </h3>
//             <input
//               type="password"
//               placeholder="Enter your password to check balance"
//               className="border p-3 rounded-lg w-full bg-gray-700 text-white"
//               id="password"
//               onChange={handleChange}
//               required
//             />
//             <button
//               onClick={fetchBalance}
//               disabled={balanceLoading || !formData.password}
//               className="bg-blue-600 text-white p-3 rounded-lg w-full uppercase hover:bg-blue-700 disabled:opacity-80 flex justify-center items-center"
//             >
//               {balanceLoading ? 'Checking Balance...' : 'Check Balance'}
//             </button>
//             <p className="mt-3">Your Balance: {balance || 'Loading...'}</p>
//           </div>

//           {/* Supply Information */}
//           {supplyInfo && (
//             <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-4">
//               <h3 className="text-3xl flex items-center space-x-3 text-purple-500 font-bold">
//                 <FaWallet /> <span>Solana Supply Information</span>
//               </h3>
//               <p>Total Supply: {supplyInfo.total_supply} SOL</p>
//               <p>Circulating Supply: {supplyInfo.circulating_supply} SOL</p>
//               <p>Non-Circulating Supply: {supplyInfo.non_circulating_supply} SOL</p>
//             </div>
//           )}

//         </div>

//         {/* Right Column: Deposit and Transfer */}
//         <div className="space-y-8">
          
//           {/* Deposit Section */}
//           <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-4">
//             <h3 className="text-3xl flex items-center space-x-3 text-purple-500 font-bold">
//               <FaArrowCircleRight /> <span>Deposit SOL</span>
//             </h3>
//             <input
//               type="number"
//               placeholder="Amount of SOL to Deposit"
//               className="border p-3 rounded-lg w-full bg-gray-700 text-white"
//               id="depositAmount"
//               onChange={handleChange}
//               value={formData.depositAmount}
//               min={0.01}
//               step={0.01}
//             />
//             <button
//               onClick={handleDeposit}
//               disabled={depositLoading}
//               className="bg-green-600 text-white p-3 rounded-lg w-full uppercase hover:bg-green-700 disabled:opacity-80 flex justify-center items-center"
//             >
//               {depositLoading ? 'Processing Deposit...' : 'Deposit'}
//             </button>
//           </div>

//           {/* Transfer Form */}
//           <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-4">
//             <h3 className="text-3xl flex items-center space-x-3 text-purple-500 font-bold">
//               <FaArrowCircleRight /> <span>Transfer Funds</span>
//             </h3>
//             <select
//               id="walletType"
//               className="border p-3 rounded-lg w-full bg-gray-700 text-white"
//               onChange={handleChange}
//               value={formData.walletType}
//             >
//               <option value="solana">Solana Wallet</option>
//               <option value="ethereum">Ethereum Wallet (via Wormhole)</option>
//             </select>

//             <input
//               type="text"
//               placeholder="Recipient Address"
//               className="border p-3 rounded-lg w-full bg-gray-700 text-white"
//               id="recipient"
//               onChange={handleChange}
//               required
//             />

//             <input
//               type="number"
//               placeholder="Amount of SOL"
//               className="border p-3 rounded-lg w-full bg-gray-700 text-white"
//               id="sol"
//               onChange={handleChange}
//               required
//               min={0.01}
//               step={0.01}
//             />

//             <button
//               disabled={loading || !formData.password}
//               className="bg-purple-600 text-white p-3 rounded-lg w-full uppercase hover:bg-purple-700 disabled:opacity-80 flex justify-center items-center"
//               onClick={handleSubmit}
//             >
//               {loading ? 'Processing...' : 'Transfer'}
//             </button>
//           </div>

//         </div>

//       </div>

//       {/* Error and Vulnerability Messages */}
//       {vulnerabilitySummary && (
//         <div className="max-w-6xl mx-auto mt-8 bg-yellow-100 p-6 rounded-lg shadow-lg">
//           <h3 className="text-xl font-semibold text-yellow-800">Vulnerability Warning:</h3>
//           <p className="text-yellow-700">{vulnerabilitySummary}</p>
//         </div>
//       )}

//       {error && (
//         <div className="max-w-6xl mx-auto mt-8 bg-red-100 p-6 rounded-lg shadow-lg">
//           <p className="text-red-500">{error}</p>
//         </div>
//       )}

//       {/* Display transfer ID if multisig is enabled */}
//       {transferId && (
//         <div className="max-w-6xl mx-auto mt-8 bg-blue-100 p-6 rounded-lg shadow-lg">
//           <h3 className="text-xl font-semibold text-blue-800">Transfer ID: {transferId}</h3>
//           <p className="text-blue-700">
//             This transfer requires multisig approval.
//           </p>
//         </div>
//       )}

//     </div>
//   );
// }
























import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import { FaWallet, FaBalanceScale, FaArrowCircleRight } from 'react-icons/fa';  // Importing Icons
import '../index.css';

export default function Transfer() {
  const [balance, setBalance] = useState(null);
  const [supplyInfo, setSupplyInfo] = useState(null);
  const [formData, setFormData] = useState({
    recipient: '',
    sol: '',
    walletType: 'solana',
    password: '',
    depositAmount: '', // For deposit
  });
  const [transferId, setTransferId] = useState(null);
  const [vulnerabilitySummary, setVulnerabilitySummary] = useState(null); // State for vulnerability
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [depositLoading, setDepositLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [confirmProceed, setConfirmProceed] = useState(false); // For user confirmation
  const navigate = useNavigate();

  // Fetch supply information on page load
  // useEffect(() => {
  //   fetchSupply();
  // }, []);

  // Fetch user balance
  const fetchBalance = async () => {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
      setError('No user email found. Please sign in again.');
      return;
    }

    setBalanceLoading(true);
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
      if (data.error) {
        setError(data.error);
      } else if (data.balance) {
        setBalance(data.balance);
      } else {
        setError('Failed to retrieve balance.');
      }
    } catch (err) {
      setError('Failed to fetch balance');
    } finally {
      setBalanceLoading(false);
    }
  };

  // // Fetch Solana supply information
  // const fetchSupply = async () => {
  //   try {
  //     const res = await fetch('http://localhost:8000/supply');
  //     const data = await res.json();
  //     if (data.error) {
  //       setError(data.error);
  //     } else {
  //       setSupplyInfo(data);
  //     }
  //   } catch (err) {
  //     setError('Failed to fetch supply information');
  //   }
  // };

  // Handle form field changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  // Handle transfer form submission
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setVulnerabilitySummary(null);

  const userEmail = localStorage.getItem('userEmail');
  const endpoint = formData.walletType === 'solana'
    ? 'http://localhost:8000/transfer'
    : 'http://localhost:8000/wormhole_transfer';

  const payload = formData.walletType === 'solana'
    ? {
        sender_email: userEmail,
        password: formData.password,
        recipient_public_key: formData.recipient,
        sol: parseFloat(formData.sol),
      }
    : {
        sender_email: userEmail,
        password: formData.password,
        recipient_eth_address: formData.recipient,
        sol: parseFloat(formData.sol),
      };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Cookies.get('token')}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (data.error) {
      setError(data.error);
    } else if (data.vulnerability_summary) {
      // Show vulnerability summary and option to proceed
      setVulnerabilitySummary(data.vulnerability_summary);
      if (data.transfer_id) {
        setTransferId(data.transfer_id); // Store the transfer ID for later use
      }
    } else if (data.transfer_id) {
      setTransferId(data.transfer_id);
    } else {
      alert('Transfer successful!');
      navigate('/dashboard');
    }
  } catch (err) {
    setError('Failed to process the transfer.');
  } finally {
    setLoading(false);
  }
};

// Ensure transferId is correctly passed when confirming to proceed
const handleProceedConfirmation = async () => {
  if (!transferId) {
    setError('Transfer ID is missing.');
    return;
  }

  try {
    const res = await fetch('http://localhost:8000/transfer_confirmation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Cookies.get('token')}`,
      },
      body: JSON.stringify({
        transfer_id: transferId, // Ensure transfer_id is sent as a string
        proceed: true,
      }),
    });

    const data = await res.json();
    if (data.error) {
      setError(data.error);
    } else {
      alert('Transfer successful!');
      navigate('/dashboard');
    }
  } catch (err) {
    setError('Failed to process the transfer confirmation.');
  }
};


  // Handle deposit submission
  const handleDeposit = async () => {
    setDepositLoading(true);
    const userEmail = localStorage.getItem('userEmail');
    const depositAmount = parseFloat(formData.depositAmount);

    if (isNaN(depositAmount) || depositAmount <= 0) {
      setError('Please enter a valid Airdrop amount.');
      setDepositLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:8000/airdrop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Cookies.get('token')}`,
        },
        body: JSON.stringify({ email: userEmail, sol: depositAmount }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        alert('Deposit successful! Check your balance.');
        fetchBalance(userEmail);
      }
    } catch (err) {
      setError('Deposit failed.');
    } finally {
      setDepositLoading(false);
    }
  };

   return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center" style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="max-w-6xl w-full bg-white/5 p-10 rounded-xl shadow-xl backdrop-blur-lg" style={{ boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.5)' }}>
        <h1 className="text-4xl text-center text-white font-bold mb-8" style={{ fontFamily: '"Roboto", sans-serif' }}>
          Transfer Funds
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Balance Section */}
          <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl flex items-center text-white mb-4 font-bold">
              <FaBalanceScale className="mr-2" /> Check Balance
            </h3>
            <input
              type="password"
              placeholder="Enter your password to check balance"
              className="border p-3 rounded-lg w-full bg-gray-700 text-white"
              id="password"
              onChange={handleChange}
              required
            />
            <button
              onClick={fetchBalance}
              disabled={balanceLoading || !formData.password}
              className="mt-4 bg-blue-600 text-white p-3 rounded-lg w-full uppercase hover:bg-blue-700 transition-transform duration-300"
            >
              {balanceLoading ? 'Checking Balance...' : 'Check Balance'}
            </button>
            <p className="mt-4 text-white">Your Balance: {balance || 'Loading...'}</p>
          </div>

          {/* Deposit Section */}
          <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl flex items-center text-white mb-4 font-bold">
              <FaWallet className="mr-2" /> Airdrop SOL
            </h3>
            <input
              type="number"
              placeholder="Amount of SOL to Aidrop"
              className="border p-3 rounded-lg w-full bg-gray-700 text-white"
              id="depositAmount"
              onChange={handleChange}
              value={formData.depositAmount}
              min={0.01}
              step={0.01}
            />
            <button
              onClick={handleDeposit}
              disabled={depositLoading}
              className="mt-4 bg-green-600 text-white p-3 rounded-lg w-full uppercase hover:bg-green-700 transition-transform duration-300"
            >
              {depositLoading ? 'Processing Airdrop...' : 'Airdrop'}
            </button>
          </div>
        </div>

        {/* Transfer Section */}
        <div className="mt-8 bg-gray-800/50 p-6 rounded-lg shadow-lg">
          <h3 className="text-2xl flex items-center text-white mb-4 font-bold">
            <FaArrowCircleRight className="mr-2" /> Transfer SOL
          </h3>
          <select
            id="walletType"
            className="border p-3 rounded-lg w-full bg-gray-700 text-white mb-4"
            onChange={handleChange}
            value={formData.walletType}
          >
            <option value="solana">Solana Wallet</option>
            <option value="ethereum">Ethereum Wallet (via Wormhole)</option>
          </select>

          <input
            type="text"
            placeholder="Recipient Address"
            className="border p-3 rounded-lg w-full bg-gray-700 text-white mb-4"
            id="recipient"
            onChange={handleChange}
            required
          />

          <input
            type="number"
            placeholder="Amount of SOL"
            className="border p-3 rounded-lg w-full bg-gray-700 text-white mb-4"
            id="sol"
            onChange={handleChange}
            required
            min={0.01}
            step={0.01}
          />

          <input
            type="password"
            placeholder="Enter Password"
            className="border p-3 rounded-lg w-full bg-gray-700 text-white mb-4"
            id="password"
            onChange={handleChange}
            required
          />

          <button
            disabled={loading || !formData.password}
            className="bg-purple-600 text-white p-3 rounded-lg w-full uppercase hover:bg-purple-700 transition-transform duration-300"
            onClick={handleSubmit}
          >
            {loading ? 'Processing...' : 'Transfer'}
          </button>
        </div>

        {/* Error Section */}
        {error && (
          <div className="mt-4 bg-red-600 p-3 rounded-lg text-white">
            {error}
          </div>
        )}

        {/* Vulnerability Summary Section */}
        {vulnerabilitySummary && (
          <div className="mt-8 bg-yellow-500 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-yellow-800">Vulnerability Warning</h3>
            <p className="text-yellow-700">{vulnerabilitySummary}</p>
            <button
              onClick={handleProceedConfirmation}
              className="mt-4 bg-red-600 text-white p-3 rounded-lg w-full uppercase hover:bg-red-700"
            >
              Proceed Anyway
            </button>
          </div>
        )}

        {/* Transfer ID Section */}
        {transferId && (
          <div className="mt-8 bg-blue-500 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-white">Transfer ID: {transferId}</h3>
            <p className="text-blue-100">This transfer requires multisig approval.</p>
          </div>
        )}
      </div>
    </div>
  );
//     <div className="min-h-screen  text-white p-6">
//       {/* Two-Column Grid Layout */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        
//         {/* Left Column: Balance and Supply Info */}
//         <div className="space-y-8">
          
//           {/* Balance Section */}
//           <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-4">
//             <h3 className="text-3xl flex items-center space-x-3 text-purple-500 font-bold">
//               <FaBalanceScale /> <span>Check Balance</span>
//             </h3>
//             <input
//               type="password"
//               placeholder="Enter your password to check balance"
//               className="border p-3 rounded-lg w-full bg-gray-700 text-white"
//               id="password"
//               onChange={handleChange}
//               required
//             />
//             <button
//               onClick={fetchBalance}
//               disabled={balanceLoading || !formData.password}
//               className="bg-blue-600 text-white p-3 rounded-lg w-full uppercase hover:bg-blue-700 disabled:opacity-80 flex justify-center items-center"
//             >
//               {balanceLoading ? 'Checking Balance...' : 'Check Balance'}
//             </button>
//             <p className="mt-3">Your Balance: {balance || 'Loading...'}</p>
//           </div>

//           {/* Supply Information */}
//           {supplyInfo && (
//             <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-4">
//               <h3 className="text-3xl flex items-center space-x-3 text-purple-500 font-bold">
//                 <FaWallet /> <span>Solana Supply Information</span>
//               </h3>
//               <p>Total Supply: {supplyInfo.total_supply} SOL</p>
//               <p>Circulating Supply: {supplyInfo.circulating_supply} SOL</p>
//               <p>Non-Circulating Supply: {supplyInfo.non_circulating_supply} SOL</p>
//             </div>
//           )}

//         </div>

//         {/* Right Column: Deposit and Transfer */}
//         <div className="space-y-8">
          
//           {/* Deposit Section */}
//           <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-4">
//             <h3 className="text-3xl flex items-center space-x-3 text-purple-500 font-bold">
//               <FaArrowCircleRight /> <span>Deposit SOL</span>
//             </h3>
//             <input
//               type="number"
//               placeholder="Amount of SOL to Deposit"
//               className="border p-3 rounded-lg w-full bg-gray-700 text-white"
//               id="depositAmount"
//               onChange={handleChange}
//               value={formData.depositAmount}
//               min={0.01}
//               step={0.01}
//             />
//             <button
//               onClick={handleDeposit}
//               disabled={depositLoading}
//               className="bg-green-600 text-white p-3 rounded-lg w-full uppercase hover:bg-green-700 disabled:opacity-80 flex justify-center items-center"
//             >
//               {depositLoading ? 'Processing Deposit...' : 'Deposit'}
//             </button>
//           </div>

//           {/* Transfer Form */}
//           <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-4">
//             <h3 className="text-3xl flex items-center space-x-3 text-purple-500 font-bold">
//               <FaArrowCircleRight /> <span>Transfer Funds</span>
//             </h3>
//             <select
//               id="walletType"
//               className="border p-3 rounded-lg w-full bg-gray-700 text-white"
//               onChange={handleChange}
//               value={formData.walletType}
//             >
//               <option value="solana">Solana Wallet</option>
//               <option value="ethereum">Ethereum Wallet (via Wormhole)</option>
//             </select>

//             <input
//               type="text"
//               placeholder="Recipient Address"
//               className="border p-3 rounded-lg w-full bg-gray-700 text-white"
//               id="recipient"
//               onChange={handleChange}
//               required
//             />

//             <input
//               type="number"
//               placeholder="Amount of SOL"
//               className="border p-3 rounded-lg w-full bg-gray-700 text-white"
//               id="sol"
//               onChange={handleChange}
//               required
//               min={0.01}
//               step={0.01}
//             />

//             <input
//               type="password"
//               placeholder="Enter Password"
//               className="border p-3 rounded-lg w-full bg-gray-700 text-white"
//               id="password"
//               onChange={handleChange}
//               required
//             />

//             <button
//               disabled={loading || !formData.password}
//               className="bg-purple-600 text-white p-3 rounded-lg w-full uppercase hover:bg-purple-700 disabled:opacity-80 flex justify-center items-center"
//               onClick={handleSubmit}
//             >
//               {loading ? 'Processing...' : 'Transfer'}
//             </button>
//           </div>

//           {vulnerabilitySummary && (
//   <div className="max-w-6xl mx-auto mt-8 bg-yellow-100 p-6 rounded-lg shadow-lg">
//     <h3 className="text-xl font-semibold text-yellow-800">Vulnerability Warning:</h3>
//     <p className="text-yellow-700">{vulnerabilitySummary}</p>
//     <button onClick={handleProceedConfirmation} className="bg-red-600 text-white p-3 rounded-lg w-full uppercase hover:bg-red-700">
//       Proceed Anyway
//     </button>
//   </div>
// )}


//         </div>
//       </div>

//       {/* Error and Vulnerability Messages */}
//       {error && (
//         <div className="max-w-6xl mx-auto mt-8 bg-red-100 p-6 rounded-lg shadow-lg">
//           <p className="text-red-500">{error}</p>
//         </div>
//       )}

//       {/* Display transfer ID if multisig is enabled */}
//       {transferId && (
//         <div className="max-w-6xl mx-auto mt-8 bg-blue-100 p-6 rounded-lg shadow-lg">
//           <h3 className="text-xl font-semibold text-blue-800">Transfer ID: {transferId}</h3>
//           <p className="text-blue-700">
//             This transfer requires multisig approval.
//           </p>
//         </div>
//       )}
//     </div>
//   );
}
