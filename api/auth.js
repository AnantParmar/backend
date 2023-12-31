const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {signInWithEmailAndPassword,createUserWithEmailAndPassword,updateProfile,sendEmailVerification,signOut} = require('firebase/auth')
const {setDoc,collection,doc,query,getDocs,where} = require('firebase/firestore');
const { ref, getDownloadURL, uploadBytesResumable } = require('firebase/storage');
const {auth,storage,db} = require('../config.js')
const bodyParser = require('body-parser');
const cookieParser = require("cookie-parser")
const crypto = require("crypto");
router.use(cookieParser());
const admin = require('firebase-admin');
require('dotenv').config();
// Initialize the Firebase Admin SDK with your service account credentials
const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
const serviceAccount = JSON.parse(serviceAccountString)
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // Optional: You can set other configuration options here
});

// storage engine 

// const mulStorage = multer.diskStorage({
//     destination: './upload/img',
//     filename: (req, file, cb) => {
//         return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
//     }
// })

const upload = multer({
    storage: multer.memoryStorage()
})

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());
// router.use(bodyParser.);

router.post('/uploadPic',upload.single("profile"), async (req,res)=>{
    res.setHeader("Access-Control-Allow-Origin", "https://jigarii-frontend.vercel.app");
    res.setHeader("Access-Control-Allow-Methods", "POST");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    console.log(`upload Pic request cookies:${req.cookies.customToken}`)
    if(req.cookies.customToken=== undefined)
    return res.status(401).send({message:"Unauthorized"})
    try {
        const dateTime = giveCurrentDateTime();
        const storageRef = ref(storage, `file/${req.file.originalname+" "+dateTime}`);
        
        const metadata = {
            contentType : req.file.mimetype,
        }

        const snapshot = await uploadBytesResumable(storageRef, req.file.buffer, metadata);
        const downloadURL  = await getDownloadURL(snapshot.ref); 
        
        updateProfile(auth.currentUser, {
            photoURL: downloadURL
        })
        await setDoc(doc(db, "users", auth.currentUser.uid), {
            photoURL: downloadURL
        }, { merge: true });
        return res.send({
            message : 'file uploaded to firebase storage',
            name: req.file.originalname,
            type: req.file.mimetype,
            downloadURL: downloadURL
        })
    }
    catch (error){
        return res.status(400).send(error.message)
    }
    
})

const giveCurrentDateTime = () => {
    const today = new Date();
    const date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDay();
    const time = today.getHours()+':'+today.getMinutes()+':'+today.getSeconds();
    const dateTime = date+ " " + time;
    return dateTime;
}
router.post('/signup', async (req,res)=>{
    res.setHeader("Access-Control-Allow-Origin","https://jigarii-frontend.vercel.app")
    await createUserWithEmailAndPassword(auth,req.body.email,req.body.password)
    .then(async (response) => {
      
        const user = response.user;

        updateProfile(user, {
            displayName: req.body.name,
        })
        
        sendEmailVerification(auth.currentUser)
        .then(() => {
        })
        .catch((error)=> {
        })
        await setDoc(doc(db, "users", user.uid), {
            name: req.body.name,
            email: req.body.email
        });
                        
        res.send(user)
    })
    .catch((error)=>{
        res.send(error)
    })
})
function generateSessionId(userId) {
    const randomData = crypto.randomBytes(16).toString('hex');
    const dataToHash = userId + randomData;
    const hash = crypto.createHash('sha256').update(dataToHash).digest('hex');
    return hash;
}   
        
router.post('/login', async (req, res)=>{
    res.setHeader("Access-Control-Allow-Origin", "https://jigarii-frontend.vercel.app");
    res.setHeader("Access-Control-Allow-Methods", "POST");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    console.log('login '+req.cookies.customToken)
    const email = req.body.username;
    const password = req.body.password;
    
    console.log(email + " " +password)
    // console.log(cookie)
    signInWithEmailAndPassword(auth, email, password)
    .then(async (response) => {
        if(!response.user.emailVerified) {
            return res.send({result :false ,msg:"The email is not verified yet."})
        }
        else {
            const customToken = await admin.auth().createCustomToken(response.user.uid);
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 30);
            res.cookie('customToken', customToken, {
                domain: '.backend-kappa-murex.vercel.app',
                secure: true, 
                httpOnly: false,
                sameSite: 'None',
                expires: expirationDate 
            });
            const q1 = query(collection(db, "likedByUser"), where("user", "==", response.user.uid));
            const quote = await getDocs(q1);
            var likedQuotesData = [];
            for (let index = 0; index < quote.docs.length; index++) {
                const docd = quote.docs[index];
                const docData = docd.data()
                likedQuotesData.push(docData);
            }
            return res.send({result:true,data:response,likedQuotesData:likedQuotesData,customToken: customToken});
        }
    })
    .catch((error) => {
        return res.send({result :false ,msg: error.code});
    });
    
})
router.get('/logout', async (req, res)=>{
    res.setHeader("Access-Control-Allow-Origin", "https://jigarii-frontend.vercel.app");
    res.setHeader("Access-Control-Allow-Methods", "GET");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    console.log('logout '+req.cookies.customToken)
    res.clearCookie('customToken')
    res.cookie('abc',"hjkrfhdjf",{
        domain: '.backend-kappa-murex.vercel.app',
        secure: true, 
        httpOnly: false,
        sameSite: 'None',
    })
    res.send({message : "Success"});
    
})
router.post('/getUser', async (req,res)=>{
    res.setHeader("Access-Control-Allow-Origin", "https://jigarii-frontend.vercel.app");
    res.setHeader("Access-Control-Allow-Methods", "POST");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    if(req.cookies.customToken=== undefined)
    return res.status(401).send({message:"Unauthorized"})
    res.send(auth.currentUser)
})
module.exports = router;