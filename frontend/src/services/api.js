import axios from "axios";

const api = axios.create({
<<<<<<< HEAD
  baseURL: import.meta.env.VITE_API_URL || "http://192.168.0.45:4000/api"
=======
  baseURL: import.meta.env.VITE_API_URL,
>>>>>>> e8d7d17146b2c3f368a61ca9065d2d91172f9534
});

export default api;
