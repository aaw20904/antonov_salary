import * as http from 'http'
 import * as fs from  "fs";
import * as url from "url";
let mainBase = false;
let fondBase=false;

import querystring from 'query-string';


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
                        mainBase.set( postedData[0][1], postedData[1][1] );
                        await readHtmlContent(req, res, "index.html",`Data received! Previous key:${postedData[0][1]}`);
                    break;
                    case "/save":
                        //convert a Map into an array:
                        let savedArray = Array.from(mainBase);
                        let stringifyString = JSON.stringify(savedArray);
                        await fs.promises.writeFile("db.json",stringifyString);
                        await readHtmlContent(req,res,"saved.html");
                    break;
                    case "/find":
                    let found = mainBase.get(postedData[0][1]);
                        if (!found) {
                            found="не знайдено"
                        }
                        await readHtmlContent(req,res, "find.html", found);
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
             
             encodedData = parseUrlEncodedString (body);
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
            if (idx>0) {
                //insert a new string
                 newContent = `${info.substring(0,idx)} ${content} ${info.substring(idx+5)}`;
                 
            }else{
                newContent = info;
            }
         }
         //set headers
         res.setHeader("Content-Type","text/html; charset=utf-8");
         res.statusCode = 200;
         let bfr = Buffer.from(newContent);
         res.setHeader("Content-Length", bfr.length.toString());
         res.end(bfr);
         return true;
    } catch (e) {
        let msg = e.toString();
        console.error('\x1b[31m%s\x1b[0m',e);
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.statusCode=500;
        let bfr3 = Buffer.from(msg)
        res.setHeader("Content-Length", bfr3.length);
        res.end(msg);

        return false;
    }
   
}


async function readStylesheets (req, res, fileName=false) {
           try {
         let info = await fs.promises.readFile(fileName);
         //set headers
         res.setHeader("Content-Type","text/css; charset=utf-8");
        
         res.setHeader("Content-Length", info.length.toString());
         res.statusCode = 200;
         res.end(info);
         return true;
    } catch (e) {
        let msg = e.toString();
        console.error('\x1b[31m%s\x1b[0m',e);
        res.setHeader("Content-Type","text/plain; charset=utf-8");
        res.statusCode=404;
        
        let bfr1=Buffer.from(msg);
        res.setHeader("Content-Length",bfr1.length.toString());
        res.end(msg);

        return false;
    }
}

function sendNotFound (res) {
    const msg="Requested resource not found!";
    res.setHeader("Content-Type","text/plain; charset=utf-8");
        res.statusCode=404;
        let bfr = Buffer.from(msg.length);
        res.setHeader("Content-Length",bfr.length);
        res.end(bfr);
}
/*

█▀ ▀█▀ ▄▀█ █▀█ ▀█▀   ▄▀█ █▀█ █▀█ █░░ █ █▀▀ ▄▀█ ▀█▀ █ █▀█ █▄░█
▄█ ░█░ █▀█ █▀▄ ░█░   █▀█ █▀▀ █▀▀ █▄▄ █ █▄▄ █▀█ ░█░ █ █▄█ █░▀█
*/
///NOTE:  base.json:  key(integer)->["description", integer_id_of_fond], fond.json: key(integer)->"text_description_of_a_fond"

/*let fonds = new Map([[1,"фонд"],[2,"собівартість"],[3,"іньші"],[4,"фонди"],[5,"Страхування від нещасного випадку"],[6,"Іньші операційні виклади"],[7,"соціальне страхування"],[8,"чорнобиьські"]]);
                       let savedArray2 = Array.from(fonds);
                        let stringifyStringX = JSON.stringify(savedArray2);
                        await fs.promises.writeFile("fond.json", stringifyStringX); */

//1) load database
 try{
  let fondsStringified = fs.readFileSync("fond.json");
  //convertong to an array
  let twoDimArray = JSON.parse(fondsStringified);
  //construct Map
  fondBase = new Map(twoDimArray);
 }catch(e){//when file not found
    process.exit();
 }
try {
    let jsonData = fs.readFileSync("db.json",{encoding:"utf8"});
    let dataarray = JSON.parse(jsonData);
    mainBase = new Map(dataarray);
    console.log("database loaded successfully!");
} catch (e) {
    mainBase = new Map();
    console.log("Database not found.Create from scratch ")
}

let server = http.createServer(onRequest);
server.listen(80,()=>console.log("Listen.."));
