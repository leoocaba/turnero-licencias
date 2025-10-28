import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://192.168.0.45:4000/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 5000,
});

export default api;
