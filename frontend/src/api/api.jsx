import axios from "axios";

const API = axios.create({
//   baseURL: process.env.REACT_APP_API_URL,
    baseURL : "http://localhost:5000/api",
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers['authorization'] = `Bearer ${token}`;
  return req;
});

export default API;
