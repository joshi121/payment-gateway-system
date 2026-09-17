import axios from 'axios';

// Create a configured axios instance pointing to the backend API server
const API = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true // Enables sending HTTP cookies across requests
});

export default API;
