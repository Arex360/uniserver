let fs = require('fs')
let express = require('express');
let bodyParser = require('body-parser')
let { exec } = require('child_process');
let uuid = require('uuid-v4')
let admin = require("firebase-admin");
let serviceAccount = require("./servicekey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'gs://serveruni-d912f.appspot.com'
});
let bucket = admin.storage().bucket()
let uploadFile = async (file)=> {

    const metadata = {
      metadata: {
        firebaseStorageDownloadTokens: uuid()
      },
      contentType: 'image/png',
      cacheControl: 'public, max-age=31536000',
    };

    await bucket.upload(file, {
      gzip: true,
      metadata: metadata,
    });
  
  console.log(`image uploaded successfully.`);
  
  }
  

let app = express()
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.post('/',(req,res)=>{
    let url = req.body.url
    let filename = req.body.filename
    let id= req.body.id
    let output = filename+"out"
    let base64 = url
    filename = filename +'.png'
    
    fs.writeFile(filename, base64, {encoding: 'base64'}, function(err) {
        console.log('File created');
        exec(`python detect.py --source ${filename} --weights final.pt --output ${output} --device cpu`,()=>{
            console.log("task completed")
            exec(`del ${filename}`)
            uploadFile(output+'.png').catch(console.error)
        })
    });
    res.send(filename)
})


app.listen(3000,()=>{
    console.log('server started')
})

