import axios from "axios";
const BASE_URL = "http://localhost:3001/api";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,             //cookie
  headers: { "Content-Type": "application/json" },
});

// Auth
export const loginUser = async (data) => {
  const res = await api.post("/auth/login", data);
  return res.data;
};

export const registerUser = async (data) => {
  const res = await api.post("/auth/register", data);
  return res.data;
};

export const logoutUser = async () => {
  await api.post("/auth/logout");
};

// Game
export const fetchGame = async (gameId) => {
  const res = await api.get(`/games/${gameId}`);
  return res.data;
};

export const createNewGame = async () => {
  const res = await api.post("/games");
  return res.data;
};

export const createAIGame = async () => {
  const res = await api.post("/games/ai");
  return res.data;
};

export const joinGame = async (gameId) => {
  const res = await api.post(`/games/${gameId}/join`);
  return res.data;
};

export const updateBoard = async (gameId, board) => {
  const res = await api.put(`/games/${gameId}/board`, { board });
  return res.data;
};

export const makeMove = async (gameId, { row, col }) => {
  const res = await api.post(`/games/${gameId}/move`, { row, col });
  return res.data;
};

export default api;
