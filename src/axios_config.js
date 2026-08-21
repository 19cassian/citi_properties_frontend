import axios from "axios";
import { jwtDecode } from "jwt-decode";


const api = axios.create({
  baseURL: "http://127.0.0.1:8000/",
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("access");
    const refreshToken=localStorage.getItem('refresh');
    decodedToken=jwtDecode(accessToken);
    if(decodedToken.exp<Date.now/1000){
      
    }


    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;