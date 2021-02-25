const net = require("net");
const client = net.createConnection({host: process.argv[2] || "localhost", port: process.argv[3] || 4040});

var commands = [];
class Command{
    constructor(name, description, run){
        commands.push({name,description,run});
    }
}

client.on("connect", () => {
    client.write(JSON.stringify({
        type: "login",
        name: process.argv[4] || "User" + Math.round(Math.random()*9999).toString()
    }));
    client.on("data", (rawData) => {
        var data = JSON.parse(rawData);
        if(data["type"] == "login"){
            console.log(`Logged in as "${data["name"]}".`)
            new Command("help", "Shows commands.", (deta) => {
                var cmdsFound = [];
                commands.forEach(cmd => {
                    cmdsFound.push(`${cmd.name}: ${cmd.description}`);
                });
                console.log(`Here are all the known commands: \n===== Start Commands =====\n${cmdsFound.join("\n")}\n===== End Commands =====`);
            });
            new Command("name", "Changes your name.", (deta) => {
                var sp = deta.split(" ");
                var args = deta.replace(sp[0] + " ","");
                client.write(JSON.stringify({
                    type: "usernamechange",
                    new: args
                }));
            });
            client._username = data["name"];
            process.stdin.on("data", (dataRaw) => {
                var data = dataRaw.toString();
                if(data.startsWith("/")){
                    commands.forEach(cmd => {
                        var commandFound = false;
                        if(data.startsWith("/" + cmd.name)){
                            commandFound = true;
                            cmd.run(data);
                        }
                    });
                } else{
                    client.write(JSON.stringify({
                        type: "chat",
                        message: data
                    }));
                }
            });     
        }
        if(data["type"] == "chat"){
            console.log(`${data["user"]}: ${data["message"]}`);
        }
        if(data["type"] == "usernamechange"){
            console.log(`Your new username is ${data["new"]}. (${data["old"]} => ${data["new"]})`);
        }
    });
});