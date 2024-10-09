import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import '../index.css';
import { FaFacebook, FaTwitter, FaLinkedin } from "react-icons/fa";

// Optional: Add an animation library like AOS (Animate on Scroll) for smooth animations
import AOS from "aos";
import "aos/dist/aos.css";

export default function Home() {

  // Initialize animations on page load
  useEffect(() => {
    AOS.init({
      duration: 1000, // Animation duration
      easing: "ease-in-out", // Easing effect
      once: true, // Only animate once
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-transparent">
      {/* Header */}
      <div className="text-center mb-12" data-aos="fade-down">
        <h1 className="text-5xl font-bold mb-4 text-white">SRK-WALLET</h1>
        <p className="text-xl text-indigo-300">Your Solana Secure Wallet</p>
      </div>

      {/* Feature Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-8 max-w-6xl">
        {/* Feature 1: Secure Transactions */}
        <div className="p-6 bg-white/10 backdrop-blur-lg rounded-lg shadow-lg hover:shadow-xl transition-shadow" data-aos="fade-up">
          <h2 className="text-2xl font-semibold mb-4 text-white flex items-center">🔒 Secure Transactions</h2>
          <p className="text-gray-300">
            Safely process Solana transactions with multi-layer authentication and real-time risk monitoring.
          </p>
        </div>

        {/* Feature 2: Killswitch for Hacks */}
        <div className="p-6 bg-white/10 backdrop-blur-lg rounded-lg shadow-lg hover:shadow-xl transition-shadow" data-aos="fade-up" data-aos-delay="100">
          <h2 className="text-2xl font-semibold mb-4 text-white flex items-center">🚨 Killswitch for Hacks</h2>
          <p className="text-gray-300">
            Instantly lock your wallet if you suspect it's compromised. No further transactions until verified.
          </p>
        </div>

        {/* Feature 3: Vulnerable Smart Contract Detection */}
        <div className="p-6 bg-white/10 backdrop-blur-lg rounded-lg shadow-lg hover:shadow-xl transition-shadow" data-aos="fade-up" data-aos-delay="200">
          <h2 className="text-2xl font-semibold mb-4 text-white flex items-center">🛡️ Vulnerable Contract Detection</h2>
          <p className="text-gray-300">
            Automatic checks for smart contracts against known vulnerabilities before any transaction.
          </p>
        </div>

        {/* Feature 4: Crypto Will */}
        <div className="p-6 bg-white/10 backdrop-blur-lg rounded-lg shadow-lg hover:shadow-xl transition-shadow" data-aos="fade-up" data-aos-delay="300">
          <h2 className="text-2xl font-semibold mb-4 text-white flex items-center">📜 Crypto Will</h2>
          <p className="text-gray-300">
            Automate asset distribution to beneficiaries with a crypto will based on wallet inactivity.
          </p>
        </div>

        {/* Feature 5: Emergency Wallet Freeze */}
        <div className="p-6 bg-white/10 backdrop-blur-lg rounded-lg shadow-lg hover:shadow-xl transition-shadow" data-aos="fade-up" data-aos-delay="400">
          <h2 className="text-2xl font-semibold mb-4 text-white flex items-center">❄️ Emergency Wallet Freeze</h2>
          <p className="text-gray-300">
            One-click freeze button to stop all wallet activity in case of suspicious or unauthorized access.
          </p>
        </div>

        {/* Feature 6: User Education */}
        <div className="p-6 bg-white/10 backdrop-blur-lg rounded-lg shadow-lg hover:shadow-xl transition-shadow" data-aos="fade-up" data-aos-delay="500">
          <h2 className="text-2xl font-semibold mb-4 text-white flex items-center">🎓 User Education & Simplicity</h2>
          <p className="text-gray-300">
            Step-by-step guides help users easily set up essential security features.
          </p>
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-12 text-center" data-aos="fade-up">
        <Link to="/sign-up" className="bg-indigo-500 text-white py-3 px-8 rounded-full hover:bg-indigo-600 transition-all transform hover:scale-105">
          Get Started with SRK-Wallet
        </Link>
      </div>

      {/* Footer with Social Media Icons */}
      <footer className="mt-16 text-gray-500 text-center">
        <p className="mb-4">Powered by Solana • Secure, Fast, and Scalable Transactions</p>
        <div className="flex justify-center space-x-4">
          <a href="#" className="text-gray-400 hover:text-white"><FaFacebook size={24} /></a>
          <a href="#" className="text-gray-400 hover:text-white"><FaTwitter size={24} /></a>
          <a href="#" className="text-gray-400 hover:text-white"><FaLinkedin size={24} /></a>
        </div>
      </footer>
    </div>
  );
}
