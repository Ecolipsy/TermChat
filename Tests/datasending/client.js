const net = require("net");
const client = net.createConnection({
    host: "localhost",
    port: 4041
});

client.on("connect", () => {
    client.write("Hello world!");
});