import { Routes, Route} from "react-router-dom";
import LandingPage from "./LandingPage";
import MainDashboard from "./MainDashboard";
import Signup from "./authpages/Signup";
import Login from "./authpages/Login";

export default function App()




{
  return (
    
      <Routes>
        <Route path="/" element={<LandingPage/>} />
        <Route path="/dashboard" element={<MainDashboard/>}/>
        <Route path="/signup" element={<Signup/>}/>
        <Route path="/login" element={<Login/>}/>

      </Routes>
    
  );
}