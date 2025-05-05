const express = require("express");

const app = express();

app.set("view engine", "ejs");

app.get("/", (req, res) =>{
    //res.send("Alô SESI Sumaré!!!!");
    res.render("index");
});

//Exercício, criar uma rota para a página Sobre
app.get("/sobre", (req, res) =>{
    //res.send("Você está na página sobre ");
    res.render("sobre");
});

app.listen(3000, () => {
    console.log(`Servidor NODEjs ativo na porta 3000`);
});