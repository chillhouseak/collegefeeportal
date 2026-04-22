import axios from "axios";

const API = axios.create({
  baseURL: "https://collegefeeportal.onrender.com/api",
});

export default API;
