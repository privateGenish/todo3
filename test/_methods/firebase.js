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

module.exports = { signInWithPassword };
