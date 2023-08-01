// import {getAuth} from "firebase/auth"
// import { initializeApp } from "firebase/app";
// import { getFirestore } from "firebase/firestore";
const {getAuth} = require('firebase/auth')
const {initializeApp} = require('firebase/app')
const {getFirestore} = require('firebase/firestore')
const {getStorage} = require('firebase/storage')
require('dotenv').config();
const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID,
  measurementId: process.env.MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();
const storage = getStorage();
// exports.app = app;
// exports.db = db;
// exports.auth = auth;

module.exports =  {app,db,auth,storage}