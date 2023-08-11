 const express = require('express');
 const cors = require('cors')
 const app = express();
 const port = 5000;
 const bodyParser = require('body-parser');
 const cookieParser = require("cookie-parser")
app.use(cookieParser());
 app.use(bodyParser.urlencoded({ extended: false }))

 const corsOptions = {
  origin: '*', // Replace with your frontend URL
  credentials: true, // Allow sending cookies
};

app.use(cors(corsOptions));
 app.use('/profile', express.static('upload/img'));
 app.get('/', (req, res)=>{
  var cookie = req.cookies.sessionId;
  if(cookie!==undefined) {
    console.log(cookie);
  }
  // res.setHeader("Access-Control-Allow-Origin","*")
  res.send("Home");
 })

 // available routes
 app.use('/api/auth', require('./api/auth'));
 app.use('/api/quote', require('./api/quote'));
 app.listen(port, ()=> {
    console.log("running");
 })