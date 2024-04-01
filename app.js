import * as http from 'http'
 import * as fs from  "fs";
import * as url from "url";
let mapOfData = false;
import querystring from 'query-string';

/*
Стабільно надається широкий вибір безпрограшних домовленостей: підприємницька діяльність, телекомунікації і кімнатні й садові рослини для
 */

async function onRequest (req, res) {
    let postedData="";
    switch (req.method) {
            case "GET":
                switch (req.url) {
                    case "/":
                       await readHtmlContent(req, res,  "find.html");
                    break;
                    case "/enter":
                       await readHtmlContent(req, res,  "index.html");
                    break;
                    case "/bootstrap.css":
                      await readStylesheets(req, res, "bootstrap.css");
                    break;
                    default:
                    sendNotFound(res);
                    
                }
                
            break;
            case "POST":
               postedData = await postListener(req, res);
                 ///what is the path?
                switch(req.url){
                    case "/init":
                        mapOfData.set( postedData["key"], postedData["value"] );
                        await readHtmlContent(req, res, "index.html",`Data received! Previous key:${postedData["key"]}`);
                    break;
                    case "/save":
                        //convert a Map into an array:
                        let savedArray = Array.from(mapOfData);
                        let stringifyString = JSON.stringify(savedArray);
                        await fs.promises.writeFile("db.json",stringifyString);
                        await readHtmlContent(req,res,"saved.html");
                    break;
                    case "/find":
                    let found = mapOfData.get(postedData["key"]);
                        if (!found) {
                            found="не знайдено"
                        }
                        await readHtmlContent(req,res,"find.html",found);
                    break;
                    default:
                     sendNotFound(res);
                }
                
            break;
            default:
            //return bad request
    }
} 

async function postListener (req, res) {

    let body="";
    let encodedData="";

    req.on("data",(chunk)=>{
        body += chunk;
    });

   return  new Promise((resolve, reject) => {

        req.on("end", ()=>{
             
             encodedData = querystring.parse(body)//parseUrlEncodedString (body);
             resolve (encodedData);
             
        });

    });
    
}

/*function parseUrlEncodedString(urlEncodedString) {
    const pairs = urlEncodedString.split('&');
    const parsedData = {};
    const parsedAsArray = [];

    pairs.forEach (pair => {
        const [key, value] = pair.split('=');
        parsedData[key] = decodeURIComponent(value); // Decode URI components if needed
        parsedAsArray.push([key, decodeURIComponent(value)]);
    });
     //returns array
    return parsedAsArray;
}*/
function parseUrlEncodedString(urlEncodedString) {
    const pairs = urlEncodedString.split('&');
    const parsedData = {};
    const parsedAsArray = [];

    pairs.forEach(pair => {
        const [key, value] = pair.split('=');
        const decodedValue = decodeURIComponent(value.replace(/\+/g, ' ')); // Replace plus symbols with spaces
        parsedData[key] = decodedValue;
        parsedAsArray.push([key, decodedValue]);
    });

    // Return the parsed data as an array
    return parsedAsArray;
}

async function readHtmlContent (req, res, fileName, content=new Date().toUTCString()) {
    let newContent;
    try {
         let info = await fs.promises.readFile(fileName,{encoding:"utf8"});
         //are there any extra embedded content?
         if(content){
            //find text
            let idx = info.indexOf(`12bef`);
            if (idx) {
                //insert a new string
                 newContent = `${info.substring(0,idx)} ${content} ${info.substring(idx+5)}`;
                 
            }
         }
         //set headers
         res.setHeader("Content-Type","text/html");
         res.setHeader("Content-Length", newContent.length.toString());
         res.statusCode = 200;
         res.end(newContent);
         return true;
    } catch (e) {
        let msg = e.toString();
        console.error('\x1b[31m%s\x1b[0m',e);
        res.setHeader("Content-Type", "text/plain");
        res.statusCode=500;
        res.setHeader("Content-Length", msg.length);
        res.end(msg);

        return false;
    }
   
}

async function readStylesheets (req, res, fileName=false) {
           try {
         let info = await fs.promises.readFile(fileName,{encoding:"utf8"});
         //set headers
         res.setHeader("Content-Type","text/css");
         res.setHeader("Content-Length", info.length.toString());
         res.statusCode = 200;
         res.end(info);
         return true;
    } catch (e) {
        let msg = e.toString();
        console.error('\x1b[31m%s\x1b[0m',e);
        res.setHeader("Content-Type","text/plain");
        res.statusCode=404;
        res.setHeader("Content-Length",msg.length);
        res.end(msg);

        return false;
    }
}

function sendNotFound(res){
    const msg="Requested resource not found!";
    res.setHeader("Content-Type","text/plain");
        res.statusCode=404;
        res.setHeader("Content-Length",msg.length);
        res.end(msg);
}
/*

█▀ ▀█▀ ▄▀█ █▀█ ▀█▀   ▄▀█ █▀█ █▀█ █░░ █ █▀▀ ▄▀█ ▀█▀ █ █▀█ █▄░█
▄█ ░█░ █▀█ █▀▄ ░█░   █▀█ █▀▀ █▀▀ █▄▄ █ █▄▄ █▀█ ░█░ █ █▄█ █░▀█
*/
//1) load database
try {
    let jsonData = fs.readFileSync("db.json",{encoding:"utf8"});
    let dataarray = JSON.parse(jsonData);
    mapOfData = new Map(dataarray);
    console.log("database loaded successfully!");
} catch (e) {
    mapOfData = new Map();
    console.log("Database not found.Create from scratch ")
}

let server = http.createServer(onRequest);
server.listen(80,()=>console.log("Listen.."));
