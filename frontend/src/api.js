const API = "http://localhost:5001";

// -------------------------------
// Helper – Get Auth Header
// -------------------------------
const authHeader = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// -------------------------------
// 1. LOGIN
// -------------------------------
export const loginUser = async (email, password) => {
  const response = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
};

// -------------------------------
// 2. REGISTER
// -------------------------------
export const registerUser = async (name, email, password) => {
  const response = await fetch(`${API}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  return response.json();
};

// -------------------------------
// 3. GET PROFILE
// -------------------------------
export const getUserProfile = async () => {
  const response = await fetch(`${API}/api/auth/profile`, {
    method: "GET",
    headers: authHeader(),
  });
  return response.json();
};

// -------------------------------
// 4. CHANGE PASSWORD
// -------------------------------
export const changePassword = async (currentPassword, newPassword) => {
  const response = await fetch(`${API}/api/auth/change-password`, {
    method: "PUT",
    headers: authHeader(),
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  return response.json();
};

// -------------------------------
// 5. GET BALANCES
// -------------------------------
export const getBalances = async () => {
  const response = await fetch(`${API}/api/auth/balances`, {
    method: "GET",
    headers: authHeader(),
  });

  return response.json();
};

// -------------------------------
// 6. UPDATE BALANCES
// -------------------------------
export const updateBalances = async (wallet, tokens, energy) => {
  const response = await fetch(`${API}/api/auth/balances`, {
    method: "PUT",
    headers: authHeader(),
    body: JSON.stringify({ wallet, tokens, energy }),
  });

  return response.json();
};

// -------------------------------
// 7. GET TECHNICAL INFO
// -------------------------------
export const getTechnicalInfo = async () => {
  const response = await fetch(`${API}/api/auth/technical-info`, {
    method: "GET",
    headers: authHeader(),
  });

  return response.json();
};
