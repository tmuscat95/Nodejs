const http = require("http");
const fs = require("fs");

function listener(req, res) {
  const url = req.url;
  const method = req.method;

}

const server = http.createServer(listener);

server.listen(3000);
