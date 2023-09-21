const express = require('express');
const router = express.Router();
const { doc,addDoc,collection, query, getDocs, getDoc, setDoc, where, deleteDoc } = require('firebase/firestore');
// const {getUser} = require()
const {db} = require('../config.js')
const bodyParser = require('body-parser');

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

router.post('/addQuote', async (req,res) => {
    res.setHeader("Access-Control-Allow-Origin","https://jigarii-frontend.vercel.app")
    console.log(`add quote request cookies:${req.cookies.customToken}`)
    if(req.cookies.customToken=== undefined)
    return res.status(401).send({message:"Unauthorized"})
    const docId  = await addDoc(collection(db, "quotes"), {
        tag: req.body.quoteTag,
        quote: req.body.quote,
        uid: req.body.uid,
        like: 0
    });
    res.send({result: "Success", docId: docId})
})
const getQuote = async (docId)=>{
    const docRef = doc(db, "quotes", docId);
    const docSnap = await getDoc(docRef);
    return docSnap.data();
}
router.put('/updateLikeCount', async (req,res) => {
    res.setHeader("Access-Control-Allow-Origin","https://jigarii-frontend.vercel.app")
    console.log(`update like count request cookies:${req.cookies.customToken}`)
    if(req.cookies.customToken=== undefined)
    return res.status(401).send({message:"Unauthorized"})
    const data = await getQuote(req.body.docId);
    if(req.body.val>0) {
        const docId  = await addDoc(collection(db, "likedByUser"), {
            quote: req.body.docId,
            user: req.body.uid
        });
    } else {
        const q1 = query(collection(db, "likedByUser"), where("quote", "==", req.body.docId), where("user", "==", req.body.uid));
        const quote = await getDocs(q1);
        for (let index = 0; index < quote.docs.length; index++) {
            const docd = quote.docs[index];
            const docData = docd.data()
            
            const docu = doc(db, "likedByUser", docd.id);
            await deleteDoc(docu);
        }

    }
    const updateValue = data.like + req.body.val;
    const docRef = doc(db, "quotes", req.body.docId);
    setDoc(docRef, {like: updateValue}, {merge: true})
    .then(()=>{
        res.send({result: "Success"})
    })
    .catch((error)=>{
        res.send({error: error})
    })
})
const getUserProfile = async (uid)=> {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    return docSnap.data();
}
const getQuotes = async (querySnapshot)=>{
    const responseArr = []
    
    for (let index = 0; index < querySnapshot.docs.length; index++) {
        const doc = querySnapshot.docs[index];
        const docData = doc.data()
        const res = await getUserProfile(docData.uid)

        var obj = {docId: doc.id, docData: doc.data(), user: res}
        responseArr.push(obj)
        
    }

    return responseArr;
}
router.get('/getQuotes', async (req,res) => {
    res.setHeader("Access-Control-Allow-Origin", "https://jigarii-frontend.vercel.app");
    res.setHeader("Access-Control-Allow-Methods", "GET");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    console.log('quotes '+req.cookies.customToken)
    res.clearCookie('customToken')
    res.cookie('customtoken', "xyzByxjnsjd", {
        domain: '.backend-kappa-murex.vercel.app',
        secure: true, // Set this to true for HTTPS
        httpOnly: false,
        sameSite: 'None', // Set this for cross-site requests
      });
    const querySnapshot = await getDocs(collection(db, "quotes"));
    getQuotes(querySnapshot)
    .then((responseArr)=>{
        res.json(responseArr)
    })

})
router.post('/getLikedCount', async (req,res)=>{
    console.log(`get like count request cookies:${req.cookies.customtoken}`)
    if(req.cookies.customToken=== undefined)
    return res.status(401).send({message:"Unauthorized"})
    const q1 = query(collection(db, "likedByUser"), where("user", "==", req.body.uid));

    const quote = await getDocs(q1);
    var likedQuotesData = [];
    for (let index = 0; index < quote.docs.length; index++) {
        const docd = quote.docs[index];
        const docData = docd.data()
        likedQuotesData.push(docData);
    }
    res.json(likedQuotesData)
})
module.exports = router;