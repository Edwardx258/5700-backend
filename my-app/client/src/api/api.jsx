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

export async function createNewGame() {
  const res = await axios.post("/games", {}, { withCredentials: true });
  const id = res.data.id ?? res.data._id;
  return { id };
}
export async function joinGame(gameId) {
  const res = await axios.post(`/games/${gameId}/join`, {}, { withCredentials: true });
  const id = res.data.id ?? res.data._id ?? gameId;
  return { id };
}
export async function createAIGame() {
  const res = await axios.post("/games/ai", {}, { withCredentials: true });
  const id = res.data.id ?? res.data._id;
  return { id };
}


export const updateBoard = async (gameId, board) => {
    const res = await api.put(`/games/${gameId}/board`, { board });
   return res.data;
};

export const makeMove = async (gameId, { row, col }) => {
  const res = await api.post(`/games/${gameId}/move`, { row, col });
  return res.data;
};

export async function listGames() {
  const res = await axios.get('/games', { withCredentials: true });
  return {
    openGames: res.data.open,
    myOpen:    res.data.myOpen,
    active:    res.data.active,
    completed: res.data.completed,
  };
}

export const listScores = async () => {
  const res = await api.get("/scores");
  return res.data;
};
export default api;
