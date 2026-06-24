import axios from "axios";

const api = axios.create({
  baseURL: "https://6cpedmjd0m.execute-api.ap-south-1.amazonaws.com",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;