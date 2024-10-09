// import React from 'react';
// import { FaSearch } from 'react-icons/fa';
// import { Link, useNavigate } from 'react-router-dom';
// import { useEffect, useState } from 'react';
// import { BiCartAlt } from "react-icons/bi";

// export default function Header() {
//   //const { currentUser } = useSelector((state) => state.user);
//   const [searchTerm, setSearchTerm] = useState('');
//   const navigate = useNavigate();

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     const urlParams = new URLSearchParams(window.location.search);
//     urlParams.set('searchTerm', searchTerm);
//     const searchQuery = urlParams.toString();
//     navigate(`/search?${searchQuery}`);
//   };

//   useEffect(() => {
//     const urlParams = new URLSearchParams(location.search);
//     const searchTermFromUrl = urlParams.get('searchTerm');
//     if (searchTermFromUrl) {
//       setSearchTerm(searchTermFromUrl);
//     }
//   }, [location.search]);

//   return (
//     <header className='bg-gradient-to-br from-indigo-100 to-purple-200 shadow-lg'>
//       <div className='flex justify-between items-center max-w-6xl mx-auto p-4'>
//         {/* <Link to='/'>
//           <h1 className='font-bold text-sm sm:text-xl flex flex-wrap'>
//             <img src={anousouk} alt="Cooperative Logo" className='h-12 w-32 sm:h-16 sm:w-48' />
//           </h1>
//         </Link> */}
//         <Link to='/'>
//             <h1 className='font-bold text-sm sm:text-xl flex flex-wrap'>
//                 <span className='text-slate-500'>SRK</span>
//                 <span className='text-slate-700'>Wallet</span>
//             </h1>
//             </Link>
//         <form
//           onSubmit={handleSubmit}
//           className='bg-white p-2 rounded-full flex items-center shadow-md'
//         >
//           <input
//             type="text"
//             placeholder='Search...'
//             className='bg-transparent focus:outline-none w-24 sm:w-64 px-2'
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//           <button>
//             <FaSearch className='text-purple-600' />
//           </button>
//         </form>
//         <ul className='flex gap-4 items-center'>
//           <Link to='/'>
//             <li className='hidden sm:inline text-purple-700 hover:underline'>Home</li>
//           </Link>
//           <Link to={'/sign-up'}>
//               <li className='text-purple-700 hover:underline'>Sign In</li>
//               </Link>
//         </ul>
//       </div>
//     </header>
//   );
// }
import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaUserCircle } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import the AuthContext
import logo from "../assets/srk-wallet.png";

export default function Header() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null); // To detect outside clicks
  const navigate = useNavigate();

  // Get authentication state and logout function from AuthContext
  const { isAuthenticated, logout } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('searchTerm', searchTerm);
    const searchQuery = urlParams.toString();
    // Perform search or handle accordingly
  };

  const handleSignOut = () => {
    // Call the logout function from AuthContext
    logout();
    // Redirect the user to the sign-in page
    navigate('/sign-in');
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // Close the dropdown when clicking outside of it
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  return (
    <header className='bg-transparent p-4'>
      <div className='flex justify-between items-center max-w-6xl mx-auto'>
        {/* Logo */}
        <Link to='/'>
          <img src={logo} alt="SRK Wallet Logo" className="h-12 w-auto" /> {/* Adjust height and width as necessary */}
        </Link>

        {/* Search form */}
        <form
          onSubmit={handleSubmit}
          className='bg-white p-2 rounded-full flex items-center shadow-md'
        >
          <input
            type="text"
            placeholder='Search...'
            className='bg-transparent focus:outline-none w-24 sm:w-64 px-2'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button>
            <FaSearch className='text-purple-600' />
          </button>
        </form>

        {/* Navigation Links */}
        <ul className='flex items-center space-x-6'>
          {isAuthenticated ? (
            <>
              {/* Profile Icon with Dropdown */}
              <li className='relative'>
                <button onClick={toggleDropdown} className='text-white flex items-center focus:outline-none'>
                  <FaUserCircle className='text-3xl' />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div ref={dropdownRef} className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2">
                    <Link
                      to="/dashboard"
                      className="block px-4 py-2 text-black hover:bg-gray-100"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/transfer"
                      className="block px-4 py-2 text-black hover:bg-gray-100"
                    >
                      Transfer
                    </Link>
                    <Link
                      to="/vote"
                      className="block px-4 py-2 text-black hover:bg-gray-100"
                    >
                      Vote
                    </Link>
                    <Link
                      to="/will"
                      className="block px-4 py-2 text-black hover:bg-gray-100"
                    >
                      Will
                    </Link>
                    <Link
                      to="/approvewill"
                      className="block px-4 py-2 text-black hover:bg-gray-100"
                    >
                      Approve Will
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-black hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to='/sign-in' className='text-white hover:underline'>
                  Sign In
                </Link>
              </li>
              <li>
                <Link to='/sign-up' className='bg-white text-black py-2 px-4 rounded-full hover:bg-gray-300'>
                  Get Started
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </header>
  );
}
