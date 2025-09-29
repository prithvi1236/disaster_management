// src/services/mockAuth.js

// Mock user database (for demo/testing purposes)
const usersDB = [
  { id: 1, name: "John Doe", email: "john@example.com", password: "123456" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", password: "abcdef" }
];

let currentUser = null;

/**
 * Simulate login
 * @param {string} email 
 * @param {string} password 
 * @returns {object} logged-in user or throws error
 */
export function login(email, password) {
  const user = usersDB.find(u => u.email === email && u.password === password);
  if (!user) {
    throw new Error("Invalid email or password");
  }
  currentUser = { id: user.id, name: user.name, email: user.email };
  return currentUser;
}

/**
 * Get the currently logged-in user
 * @returns {object|null}
 */
export function getCurrentUser() {
  return currentUser;
}

/**
 * Simulate logout
 */
export function logout() {
  currentUser = null;
}

/**
 * Simulate user registration (for volunteer sign-up)
 * @param {object} volunteerData
 * @returns {object} created user
 */

export function signup(volunteerData) {
  const id = usersDB.length + 1;
  const newUser = { id, ...volunteerData };
  usersDB.push(newUser);
  currentUser = { id: newUser.id, name: newUser.name, email: newUser.email };
  return currentUser;
}


/**
 * Check if user is logged in
 * @returns {boolean}
 */
export function isLoggedIn() {
  return currentUser !== null;
}
