// src/components/PrivateRoute.js
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // Redirect to sign-in page if not authenticated
    return <Navigate to="/sign-in" />;
  }

  return children;
};

export default PrivateRoute;
