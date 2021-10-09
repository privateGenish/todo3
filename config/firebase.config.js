require("dotenv").config();

var admin = require("firebase-admin");
console.log("before: \n" + process.env.private_key)
const private_key = process.env.private_key.replace(/\\n/g, '\n');

const serviceAccount = {
  type: "service_account",
  project_id: "todoapp-68338",
  private_key_id: process.env.private_key_id,
  private_key: private_key,
  client_email: "firebase-adminsdk-qbov8@todoapp-68338.iam.gserviceaccount.com",
  client_id: "106592824360340477460",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-qbov8%40todoapp-68338.iam.gserviceaccount.com",
};
console.log(serviceAccount);

console.log("Initalizing Firebase");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports.admin = admin;
