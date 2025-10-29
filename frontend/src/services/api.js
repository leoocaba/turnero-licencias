import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || `${location.protocol}//${location.hostname}:4000/api`;

const api = axios.create({
  baseURL: BASE,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

export default api;
