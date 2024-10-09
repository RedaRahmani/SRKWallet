// src/context/AuthContext.js
import { createContext, useState, useContext } from "react";
import Cookies from 'js-cookie';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!Cookies.get('token'));

  const login = (token) => {
    Cookies.set('token', token, { expires: 1, secure: true, sameSite: 'Strict' });
    setIsAuthenticated(true);
  };

  const logout = () => {
    Cookies.remove('token');
    localStorage.removeItem('token');
    localStorage.removeItem('publicKey');
    localStorage.removeItem('userEmail');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
