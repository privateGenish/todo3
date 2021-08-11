require("dotenv").config();
const axios = require("axios");

async function signInWithPassword(email, password) {
  const request = await axios.post(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.api_key}`,
    {
      email: email,
      password: password,
      returnSecureToken: true,
    }
  );
  return request.data;
}

async function createUser(email, password) {
  const request = await axios.post(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${process.env.api_key}`, {
    email: email,
    password: password,
    returnSecureToken: true,
  });
  return request.data;
}

async function deleteUser(idToken) {
  const request = await axios.post(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${process.env.api_key}`, {
    idToken: idToken,
  });
  return request.data;
}

module.exports = { signInWithPassword, createUser, deleteUser };
