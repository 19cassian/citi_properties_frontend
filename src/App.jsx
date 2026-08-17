import { Routes, Route} from "react-router-dom";
import LandingPage from "./LandingPage";
import MainDashboard from "./MainDashboard";
import Signup from "./authpages/Signup";
import Login from "./authpages/Login";
import { Toaster } from 'react-hot-toast';
import { ProtectedRoutes } from "./ProtectedRoutes";
export default function App()



{
  return (
    <>
    <Toaster position="top-center" />
    <Routes>
      <Route element={<ProtectedRoutes/>}>
        <Route path="/dashboard" element={<MainDashboard/>}/>
        </Route>
        <Route path="/" element={<LandingPage/>} />
        <Route path="/signup" element={<Signup/>}/>
        <Route path="/login" element={<Login/>}/>

      </Routes>
    </>
  );
}