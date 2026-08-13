import { Routes, Route} from "react-router-dom";
import LandingPage from "./LandingPage";
import MainDashboard from "./MainDashboard";

export default function App()


{
  return (
    
      <Routes>
        <Route path="/" element={<LandingPage/>} />
        <Route path="/dashboard" element={<MainDashboard/>}/>
      </Routes>
    
  );
}