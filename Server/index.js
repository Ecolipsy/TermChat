const net = require("net");
const server = net.createServer();
const clients = [];

function isValidJSON(json) {
    try {
      JSON.parse(json);
      return true;
    } catch(e) {
      return false;
    }
}

function existsUser(name){
    var taken = false;
    clients.forEach(cli => {
        if(cli._username == name) taken = true;
    });
    return taken;
}

server.on("connection", (client) => {
    console.log(`Client (${client.remoteAddress}) has connected.`);
    client.on("error", (e) => {console.log(e.stack)});
    client._loggedIn = false;
    client.on("data", (rawData) => {
        //console.log(`Data from ${client.localAddress}`);
        var stringData = rawData.toString();
        if(!isValidJSON(stringData)) return;
        var data = JSON.parse(stringData);
        if(!data["type"]) return;
        if(data["type"] == "login"){
            //console.log(`Login from ${client.localAddress}`);
            if(client._loggedIn !== false) return;
            if(!data["name"]) return;
            var name = data["name"].replace(/[\n\r]/gm, "").split(" ")[0];
            if(existsUser(name) || name == "System") return client.write(JSON.stringify({type: "chat", user: "System", message: "That user already exists or username forbidden."}));
            console.log(`${name} has logged in.`);
            client._username = name;
            client._loggedIn = true;
            clients.push(client);
            client.write(JSON.stringify({type: "login", name, success: true}));
            setTimeout(() => {
                clients.forEach(cli => {
                    cli.write(JSON.stringify({
                        type: "chat",
                        user: "System",
                        message: name + " has joined the chat."
                    }));
                });
            },700);
        }
        if(data["type"] == "chat"){
            console.log(`Message from ${client.localAddress}`);
            if(!client._loggedIn) return;
            if(!client._username) return;
            if(!data["message"]) return;
            clients.forEach(cli => {
                cli.write(JSON.stringify({type: "chat", user: client._username, message: data["message"].replace(/[\n\r]/gm,"")}));
            });
        }
        if(data["type"] == "usernamechange"){
            if(!data["new"]) return;
            if(!client._username) return;
            if(!client._loggedIn) return;
            var newN = data["new"].replace(/[\n\r]/gm,"").split(" ")[0];
            if(existsUser(newN) || newN == "System") return client.write(JSON.stringify({type: "chat", user: "System", message: "That user already exists or username forbidden."}));
            var old = client._username;
            clients.forEach(cli => {
                if(cli._username == old) cli._username = newN;
            });
            client._username = newN;
            client.write(JSON.stringify({
                type: "usernamechange",
                old,
                new: newN
            }));
            clients.forEach(cli => {
                cli.write(JSON.stringify({
                    type: "chat",
                    user: "System",
                    message: old + " has changed their names. (" + old + " => " + newN + ")"
                }));
            });
        }
    });
    client.on("close", () => {
        if(!client._loggedIn) return;
        if(!client._username) return;
        clients.forEach(cli => {
            cli.write(JSON.stringify({
                type: "chat",
                user: "System",
                message: client._username + " has left the chat."
            }));
        });
        clients.splice(clients.indexOf(client), 1);
    });
});

server.listen(4040);