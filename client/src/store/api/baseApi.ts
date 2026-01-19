import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3003", // <-- your base URL
  headers: {
    "Content-Type": "application/json",
  },
});

export const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return { Authorization: token ? `Bearer ${token}` : "" };
};