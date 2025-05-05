const express = require("express");
const session = require("express-session");
const sqlite3 = require("sqlite3");
//const bodyparser = require("body-parser");

const app = express();

const PORT = 4000;

//Conexao com o Banco de Dados
const db = new sqlite3.Database("users.db");

db.serialize( () => {
    db.run(
        "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT)"
    )
})

app.use('/static', express.static(__dirname + '/static'));


//app.use(bodyparser.urlencoded({extended: true})); //versão express 4
app.use(express.urlencoded({extended: true})); //versão express 5

app.set('view engine', 'ejs');

app.get("/", (req, res) =>{
    console.log("GET /");
    res.render("./pages/index");
});

app.get("/sobre", (req, res) =>{
    console.log("GET /sobre")
    res.render("./pages/sobre");
});

app.get("/cadastro", (req, res) =>{
    console.log("GET /cadastro")
    res.render("./pages/cadastro");
});

app.post("/cadastro", (req, res) =>{
    console.log("POST /cadastro")
    console.log(JSON.stringify(req.body));
    const {username, password} = req.body;

    const query = "SELECT * FROM users WHERE username=?"

    db.get(query, [username], (err, row) => {
        if (err) throw err;

           //1. Verificar se o usuário existe
        console.log("Query SELECT do Cadastro:", JSON.stringify(row));
        if(row) {
            //2. Se o usuário existir e a senha é válida no BD, executar processo de login
           console.log(`Usuário: ${username} já cadastrado.`);
           res.send("Usuário já Cadastrado");
        } else {
            //3. Se não, executar processo de negação de login
            const insert = "INSERT INTO users (username, password) VALUES (?,?)"
            db.get(insert, [username, password], (err, row) => {
                if(err) throw err;

                console.log(`Usuário: ${username} cadastrado com sucesso.`)
                res.redirect("/login");
            })
        }

    })

});

app.get("/login", (req, res) =>{
    console.log("GET /login")
    res.render("./pages/login");
});

app.post("/login", (req, res) =>{
    console.log("POST /login")
    console.log(JSON.stringify(req.body));
    const {username, password} = req.body;

    const query = "SELECT * FROM users WHERE username=? AND password=?"
    db.get(query, [username, password], (err, row) => {
        if (err) throw err;
           //1. Verificar se o usuário existe
        console.log(JSON.stringify(row));
        if(row) {
            //2. Se o usuário existir e a senha é válida no BD, executar processo de login
            res.redirect("/dashboard");
        } else {
            //3. Se não, executar processo de negação de login
            res.send("Usuário inválido");
        }

       
    })


});

app.get("/dashboard", (req, res) =>{
    console.log("GET /dashboard")
    res.render("./pages/dashboard");
});

app.listen(PORT);

app.listen(PORT, () =>{
    console.log(`Servidor sendo executado na porta ${PORT}`);
    console.log(__dirname + "\\static");
});