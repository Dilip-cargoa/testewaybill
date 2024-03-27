const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const { NodeRSA } = require('node-rsa');

const app = express();
const PORT = process.env.PORT || 4000;

const publicKeyPath = '/home/hp/Desktop/certificate_publickey.pem'; 

app.use(express.json());

// Function to generate unique uuid 32 characters for sek
function createAESKey(length) {
    const buffer = crypto.randomBytes(32);

    return buffer.toString('base64');
}   
// headers
const header = {
    'client-id': 'IRISf980a2bf3c7b8d7fbfe23031eaa60a22',
    'client-secret': '94064a613d557692b93ffa164571b4b3',
    'gstin': '05AAAAU1183B1Z0',
    'authtoken': '0aAjBKdo7rcNYJB30g5DS2u8z',
    'Content-Type': 'application/json'
};
// Function to encrypt Auth with public key to generate tokens
async function encryptAsymmetricKey(clearText) {
   // console.log(clearText)
   const text= clearText.toString('base64')
    //const base64Text = Buffer.from(clearText).toString("base64");
    try {
        const publicKey = fs.readFileSync(publicKeyPath, 'utf8');
        
        const encryptedData = crypto.publicEncrypt({
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_PADDING // Use PKCS#1 padding
        },text); //Buffer.from(clearText));
    
        return encryptedData.toString('base64');
       

       // const encryptedText = crypto.publicEncrypt(publicKey, Buffer.from(clearText));
   
    } catch (error) {
        throw error;
    }
}

// Function to decrypt symmetric key
function DecryptBySymmetricKey(encryptedSek,appKey) {
    try {
       // const appKey = createAESKey();
        const decipher = crypto.createDecipheriv('aes-128-ecb', appKey, Buffer.alloc(0));
        let decryptedSek = decipher.update(encryptedSek, 'base64', 'utf8');
        decryptedSek += decipher.final('utf8');
        return decryptedSek;
    } catch (error) {
        throw error;
    }
}

// Function to encrypt by symmetric key
function encryptBySymmetricKey(text, sek) {
    try {
        const dataToEncrypt = Buffer.from(text, 'base64');
        const keyBytes = Buffer.from(sek, 'base64');
        const cipher = crypto.createCipheriv('aes-256-ecb', keyBytes, Buffer.alloc(0));
        let encrypted = cipher.update(dataToEncrypt, null, 'base64');
        encrypted += cipher.final('base64');
        return encrypted;
    } catch (ex) {
        throw ex;
    }
}

// Main authentication function
async function main() {
    try {
        const appKey = createAESKey(32);
      
        const payload = {
           "action": "ACCESSTOKEN",
            "username": "05AAAAU1183B1Z0",
            "password": "abc123@@",
            "app_key": appKey
           
        };
        console.log("Payload: ", payload);
        const authStr = JSON.stringify(payload);
        console.log(authStr)
// const authBytes = Buffer.from(authStr, 'utf8');
// console.log(authBytes)
        const encryptedPayload = await encryptAsymmetricKey(authStr); 
        console.log("Encrypted Payload: ", encryptedPayload);
       const Data = { "Data": encryptedPayload };
       console.log(JSON.stringify(Data))// payload data for auth api
        const headers = {
            'client-id': 'IRISf980a2bf3c7b8d7fbfe23031eaa60a22',
            'client-secret': '94064a613d557692b93ffa164571b4b3',
            'Content-Type': 'application/json',
            'Gstin': '05AAAAU1183B1Z0'
        }; // headers for auth api

        const response = await axios.post(' https://stage.gsp.portal.irisgst.com/ewaybillapi/v1.03/auth/',JSON.stringify(Data), { headers });
       
        const responseData = response.data;
// if response is success status is 1 else 0
        if (responseData.status === "1") {
            console.log("Authentication successful!");
            const authtoken = responseData.authtoken; // taking authtoken
            const sek = responseData.sek; // taking sek value
            console.log("Authtoken: ", authtoken);
            console.log("Encrypted SEK: ", sek);
            const decryptedSek = DecryptBySymmetricKey(sek,appKey); // decrypting the sek with appkey
            console.log("Decrypted SEK: ", decryptedSek);
            return { decryptedSek, authtoken };
        } else {
            console.log("Authentication failed!");
            const base64Error = responseData.error;
            const decodedError = Buffer.from(base64Error, "base64").toString("utf-8");
           // console.log("Decoded error message: ", decodedError);
            throw new Error(decodedError);
        }
    } catch (error) {
        throw error;
    }
}

// Route for authentication
app.post('/authenticate', async (req, res) => {
    try {
        const result = await main(); // calling the main () wihc has auth functionality
        res.status(200).json({ message: 'Authentication successful!', result });
    } catch (error) {
        console.error("Error: ", error);
        res.status(500).json({ error: "Internal Server Error", specificError: error.message });
    }
});
// sample data 
const requestData = {
    "supplyType":"O",
    "subSupplyType":"1",
    "subSupplyDesc":"",
    "docType":"INV",
    "docNo":"7001-8",
    "docDate":"15/12/2017",
    "fromGstin":"29AKLPM8755F1Z2",
    "fromTrdName":"welton",
    "fromAddr1":"2ND CROSS NO 59  19  A",
    "fromAddr2":"GROUND FLOOR OSBORNE ROAD",
    "fromPlace":"FRAZER TOWN",
    "fromPincode":560090,
    "actFromStateCode":29,
    "fromStateCode":29,
    "toGstin":"02EHFPS5910D2Z0",
    "toTrdName":"sthuthya",
    "toAddr1":"Shree Nilaya",
    "toAddr2":"Dasarahosahalli",
    "toPlace":"Beml Nagar",
    "toPincode":560090,
    "actToStateCode":29,
    "toStateCode":27,
    "transactionType":4,
    "otherValue":"-100",
    "totalValue":56099,
    "cgstValue":0,
    "sgstValue":0,
    "igstValue":300.67,
    "cessValue":400.56,
    "cessNonAdvolValue":400,
    "totInvValue":68358,
    "transporterId":"",
    "transporterName":"",
    "transDocNo":"",
    "transMode":"1",
    "transDistance":"100",
    "transDocDate":"",
    "vehicleNo":"PVC1234",
    "vehicleType":"R",
    "itemList":
    [{
    "productName":"Wheat",
    "productDesc":"Wheat",
    "hsnCode":1001,
    "quantity":4,
    "qtyUnit":"BOX",
    "cgstRate":0,
    "sgstRate":0,
    "igstRate":3,
    "cessRate":3,
    "cessNonadvol":0,
    "taxableAmount":5609889
    }
    ]
    }
    // generate e way bill
app.post('/generateEwayBill', async (req, res) => {
    try {
        const result = await main()
        const sek = `${result.sek}`; // Replace with your symmetric key
        const encryptedData = encryptBySymmetricKey(JSON.stringify(requestData), sek);
        const payload = {
            "action": "GENEWAYBILL",
           "data":encryptedData
        };
        const headers = header

        const response = await axios.post('https://stage.gsp.portal.irisgst.com/ewaybillapi/v1.03/ewayapi/', { data: payload }, { headers });
        const responseData = response.data;
if(responseData.status =='1'){
    const decryptedData = DecryptBySymmetricKey(responseData.data, sek);
    res.status(200).json({ message: 'E-way bill generated successfully!', data: JSON.parse(decryptedData) });
}else if(responseData.status =='0'){
    console.log("E way bill Generation failed!");
    const base64Error = responseData.error;
    const decodedError = Buffer.from(base64Error, "base64").toString("utf-8");
    console.log("Decoded error message: ", decodedError);
    throw new Error(decodedError);
}
       
    } catch (error) {
        console.error("Error: ", error);
        res.status(500).json({ error: "Internal Server Error", specificError: error.message });
    }
});
// get e Way bill 
app.get('/getEwayBill', async (req, res) => {
    try {
        const result = await main()
        const sek = `${result.sek}`; // Replace with your symmetric key
        // Prepare request headers
        const headers = {
            'client-id': 'IRISf980a2bf3c7b8d7fbfe23031eaa60a22',
            'client-secret': '94064a613d557692b93ffa164571b4b3',
           
            'gstin': '05AAAAU1183B1Z0',
            'authtoken': '0aAjBKdo7rcNYJB30g5DS2u8z'
            //'Content-Type': 'application/json'
        };

        // Make GET request
        const response = await axios.get(`https://stage.gsp.portal.irisgst.com/ewaybillapi/v1.03/ewayapi/GetEwayBill?ewbNo=191000001846?ewbNo=191000001846`  , { headers });
        const responseData = response.data;

        // Decrypt data using symmetric encryption key (sek)
        const rek = DecryptBySymmetricKey(responseData.rek, sek);
        const data = DecryptBySymmetricKey(responseData.data, rek);

        // Decode Base64 string to plain text
        const reqDatabytes = Buffer.from(data, 'base64');
        const requestData = reqDatabytes.toString('utf-8');

        // Generate HMAC and compare with the received HMAC
        const hmac = generateHMAC(data, Buffer.from(rek, 'base64'));
        if (responseData.hmac === hmac) {
            // HMAC verification successful
            // You can use requestData here
            res.status(200).send(requestData);
        } else {
            // HMAC verification failed
            res.status(400).send('HMAC verification failed');
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal Server Error", specificError: error.message });
    }
});
// update e Way bill

app.post('/updateVehicle', async(req, res) => {
    try {
        const result = await main()
        const sek = `${result.sek}`; // Replace with your symmetric key
      
        const { ewbNo, vehicleNo, fromPlace, fromState, reasonCode, reasonRem, transMode, transDocNo, transDocDate } = req.body;

        const body = {
            "ewbNo": 111000609282,
            "vehicleNo": "PQR1234",
            "fromPlace": "BANGALORE",
            "fromState": 29,
            "reasonCode": "1",
            "reasonRem": "vehicle broke down",
            "transDocNo ": "1234 ",
            "transDocDate ": "12/10/2017 ",
            "transMode": "1",
            "vehicleType": "R"
            }

        const encryptedPayload = encryptBySymmetricKey(JSON.stringify(body), sek);

        const payload = {
            "action": "VEHEWB",
           "data":encryptedPayload
        };
        const headers = header

        const response = await axios.post('https://stage.gsp.portal.irisgst.com/ewaybillapi/v1.03/ewayapi/', { data: encryptedPayload }, { headers })
           
            const responseData = response.data;
            if(responseData.status =='1'){
                const decryptedData = DecryptBySymmetricKey(responseData.data, sek);
                const reqDatabytes = Buffer.from(decryptedData, 'base64');
                 const requestData = reqDatabytes.toString('utf8');
                res.status(200).json({ message: 'E-way bill updated successfully!', data:requestData });
                //res.status(200).json({ message: 'E-way bill generated successfully!', data: JSON.parse(decryptedData) });
            }else if(responseData.status =='0'){
                console.log("E way bill updation failed!");
                const base64Error = responseData.error;
                const decodedError = Buffer.from(base64Error, "base64").toString("utf-8");
                console.log("Decoded error message: ", decodedError);
                throw new Error(decodedError);
            }
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// Route to cancel Eway Bill
app.post('/CancelEwayBill', async (req, res) => {
    try {
        const result = await main()
        const sek = `${result.sek}`;
        const requestData = {
            ewbNo: 111000609282,
            cancelRsnCode: 2,
            cancelRmrk: "Cancelled the order"
        };
        const encryptedData = encryptBySymmetricKey(JSON.stringify(requestData), sek);
        const payload = {
            "action": "CANEWB",
           "data":encryptedData
        };
        const headers = header
        const response = await axios.post('https://stage.gsp.portal.irisgst.com/ewaybillapi/v1.03/ewayapi/', { data: payload }, { headers });

        const responseData = response.data;
        if(responseData.status =='1'){
            const decryptedData = DecryptBySymmetricKey(responseData.data, sek);
            const reqDatabytes = Buffer.from(decryptedData, 'base64');
             const requestData = reqDatabytes.toString('utf8');
            res.status(200).json({ message: 'E-way bill Cancelled successfully!', data:requestData });
            //res.status(200).json({ message: 'E-way bill generated successfully!', data: JSON.parse(decryptedData) });
        }else if(responseData.status =='0'){
            console.log("E way bill cancelation failed!");
            const base64Error = responseData.error;
            const decodedError = Buffer.from(base64Error, "base64").toString("utf-8");
            console.log("Decoded error message: ", decodedError);
            throw new Error(decodedError);
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// Route to reject Eway Bill
app.post('/ExtendEwayBill', async (req, res) => {
    try {
        const result = await main()
        const sek = `${result.sek}`;
        const requestData = {
            "ewbNo": 161000843009,
            "vehicleNo": "PQR1234",
            "fromPlace":"Bengaluru",
            "fromState":"29",
            "remainingDistance":50,
            "transDocNo": "1234",
            "transDocDate":"12/10/2017",
            "transMode":"5",
            "extnRsnCode":1,
            "extnRemarks":"Flood",
            "fromPincode":560090,
            "consignmentStatus":"T",
            "transitType":"R",
            "addressLine1":"Bengaluru",
            "addressLine2":"Bengaluru",
            "addressLine3":"Bengaluru"
           }
        const encryptedData = encryptBySymmetricKey(JSON.stringify(requestData), sek);
        const payload = {
            "action": "EXTENDVALIDITY",
           "data":encryptedData
        };
         const headers = header //{
        //     'client-id': 'IRISf980a2bf3c7b8d7fbfe23031eaa60a22',
        //     'client-secret': '94064a613d557692b93ffa164571b4b3',
           
        //     'gstin': '05AAAAU1183B1Z0',
        //     'authtoken': '0aAjBKdo7rcNYJB30g5DS2u8z',
        //     'Content-Type': 'application/json'
        // };
     
        const response = await axios.post('https://stage.gsp.portal.irisgst.com/ewaybillapi/v1.03/ewayapi/', { data: payload }, { headers });

        const responseData = response.data;
        // const decryptedData = DecryptBySymmetricKey(responseData.data, sek);
        
        // res.status(200).json(JSON.parse(decryptedData));
        if(responseData.status =='1'){
            const decryptedData = DecryptBySymmetricKey(responseData.data, sek);
            const reqDatabytes = Buffer.from(decryptedData, 'base64');
             const requestData = reqDatabytes.toString('utf8');
            res.status(200).json({ message: 'E-way bill Validity Extended successfully!', data:requestData });
            //res.status(200).json({ message: 'E-way bill generated successfully!', data: JSON.parse(decryptedData) });
        }else if(responseData.status =='0'){
            console.log("E way bill Validity Extention failed!");
            const base64Error = responseData.error;
            const decodedError = Buffer.from(base64Error, "base64").toString("utf-8");
            console.log("Decoded error message: ", decodedError);
            throw new Error(decodedError);
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
