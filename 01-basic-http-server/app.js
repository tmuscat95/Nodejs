const http = require("http");
const fs = require("fs");

function listener(req, res) {
  //process.exit(); exits the node program with 0 response code
  const url = req.url;
  const method = req.method;
  res.setHeader("Content-Type", "text/html");

  if (url === "/") {
    res.write(`<html>
        <head>
            <title>HelloWorld</title>
            <body>
                <h1>Hello</h1>
            </body>
            <form action="/message" method="POST">
                <input type="text" name="message"/>
                <button type="submit">Submit</button>
            </form>
        </head>
    </html>`);
  }

  if (url === "/message" && method === "POST") {
    const body = [];
    req.on("data", (chunk) => {
      //when data arrives in buffer; callback is executed.
      console.log(chunk);
      body.push(chunk);
    });
    req.on("end", () => {
      const parsedBody = Buffer.concat(body).toString(); //concatenates byte array; message=TEXT_HERE
      const message = parsedBody.split("=")[1];
      fs.writeFile("message.txt", message, (error) => { //asynchronous version; writeFileSync for blocking version
        //runs on operation completion.
        res.statusCode = 302; //redirect
        res.setHeader("Location", "/");
        return res.end();
      });
    }); //Callback runs on request finished; buffer is empty

    //res.writeHead(302,{"Location":"/"});
  }

  return res.end();
}

const server = http.createServer(listener);

server.listen(3000);
