// import { BrowserRouter, Routes, Route } from "react-router-dom"
// import Home from './pages/Home'
// import Signin from "./pages/Signin"
// import Signup from "./pages/Signup"
// import Header from "./components/Header"
// import Transfer from "./pages/Transfer"
// import Vote from "./pages/Vote"
// import Will from "./pages/Will"
// import ApproveWill from "./pages/Approvewill"
// import VideoBg from './assets/VideoBg2.mp4';
// import { useState } from "react";

// export default function App(){
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   return(
//   <div className="app">
//     <div className="background">
//         <video src={VideoBg} autoPlay loop muted className="background-video" />
//         <div className="overlay"></div>
//     </div>
//     <BrowserRouter >
//      {/* Pass isAuthenticated and setIsAuthenticated to Header */}
//      <Header isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
//     <Header/>
//       <div className="content-wrapper">
//       <Routes>
//           <Route path="/" element={<Home />}/>
//           {/* <Route path="/sign-in" element={<Signin />}/> */}
//           <Route path="/sign-in" element={<Signin setIsAuthenticated={setIsAuthenticated} />} />
//           <Route path="/sign-up" element={<Signup />}/>
//           <Route path="/transfer" element={<Transfer />}/>
//           <Route path="/vote" element={<Vote />}/>
//           <Route path="/will" element={<Will />}/>
//           <Route path="/approvewill" element={<ApproveWill />}/>
//       </Routes>
//       <div/>
//     </BrowserRouter>
//   </div>
// )}
// App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from './context/AuthContext.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import Home from './pages/Home';
import Signin from "./pages/Signin";
import Signup from "./pages/Signup";
import Header from "./components/Header";
import Transfer from "./pages/Transfer";
import Vote from "./pages/Vote";
import Will from "./pages/Will";
import ApproveWill from "./pages/Approvewill";
import Dashboard from "./pages/Dashboard";
import './index.css';
import VideoBg from './assets/VideoBg2.mp4';

export default function App() {
  return (
    <AuthProvider>
      <div className="app">
        {/* Global Video Background */}
        <div className="background">
          <video src={VideoBg} autoPlay loop muted className="background-video" />
          <div className="overlay"></div>
        </div>

        <BrowserRouter>
          <Header />
          <div className="content-wrapper">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/sign-in" element={<Signin />} />
              <Route path="/sign-up" element={<Signup />} />

              {/* Protected Routes */}
              <Route 
                path="/transfer" 
                element={
                  <PrivateRoute>
                    <Transfer />
                  </PrivateRoute>
                }
              />
              <Route 
                path="/vote" 
                element={
                  <PrivateRoute>
                    <Vote />
                  </PrivateRoute>
                }
              />
              <Route 
                path="/will" 
                element={
                  <PrivateRoute>
                    <Will />
                  </PrivateRoute>
                }
              />
              <Route 
                path="/approvewill" 
                element={
                  <PrivateRoute>
                    <ApproveWill />
                  </PrivateRoute>
                }
              />
              <Route 
                path="/dashboard" 
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
            </Routes>
          </div>
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}
