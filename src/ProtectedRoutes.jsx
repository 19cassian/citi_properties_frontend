import React from 'react'
import { Navigate, Outlet} from 'react-router-dom';


export const ProtectedRoutes = () => {
  const token = localStorage.getItem('access'); 

  return token ? <Outlet /> : <Navigate to="/login" replace />;
};
