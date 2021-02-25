const net = require("net");
const server = net.createServer();

server.on("connection", (client) => {
    client.on("data", (d) => {
        console.log(d.toString());
    });
});

server.listen(4041);