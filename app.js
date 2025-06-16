const express = require("express");
const session = require("express-session");
const sqlite3 = require("sqlite3");

const xss = require("xss"); // Biblioteca para evitar ataques XSS

// Função para sanitizar entradas e evitar scripts maliciosos
function cleanData(userInput) {
    return xss(userInput);
}

const app = express();
const PORT = 4000;

// Conexão com o Banco de Dados
const db = new sqlite3.Database("users.db");

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT)");

    db.run("CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, id_users INTEGER, titulo TEXT, conteudo TEXT, data_criacao TEXT)");
});

app.use(session({
    secret: "senhaforte",
    resave: true,
    saveUninitialized: true,
}));

app.use('/static', express.static(__dirname + '/static'));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Rotas principais
app.get("/", (req, res) => {
    console.log("GET /index");
    res.render("./pages/index", { titulo: "Index", req: req });
});

app.get("/sobre", (req, res) => {
    console.log("GET /sobre");
    res.render("./pages/sobre", { titulo: "Sobre", req: req });
});

app.get("/cadastro", (req, res) => {
    console.log("GET /cadastro");
    res.render("./pages/cadastro", { titulo: "Cadastro", req: req });
});

app.post("/cadastro", (req, res) => {
    console.log("POST /cadastro");
    const username = cleanData(req.body.username);
    const password = cleanData(req.body.password);
    db.get("SELECT * FROM users WHERE username=?", [username], (err, row) => {
        if (err) throw err;
        if (row) {
            res.redirect("/ja-cadastrado");
        } else {
            db.run("INSERT INTO users (username, password) VALUES (?,?)", [username, password], (err) => {
                if (err) throw err;
                res.redirect("/cadastro-sucedido");
        });
        }
    });
});

app.get("/login", (req, res) => {
    console.log("GET /login");
    res.render("./pages/login", { titulo: "Login", req: req });
});

app.post("/login", (req, res) => {
    console.log("POST /login");
    const username = cleanData(req.body.username);
    const password = cleanData(req.body.password);

    db.get("SELECT * FROM users WHERE username=? AND password=?", [username, password], (err, row) => {
        if (err) throw err;
        if (row) {
            req.session.loggedin = true;
            req.session.username = username;
            req.session.id_username = row.id;
            if (username == "Admin") {
                req.session.adm = true;
                return res.redirect("/dashboard");
            } else {
                res.redirect("/postagens");
                req.session.loggedin = true;
            }
        }
    })
});

app.get("/cadastro-sucedido", (req, res) => {
    console.log("GET /cadastro-sucedido");
    res.render("pages/cadastro-sucedido", { título: "cadastro-sucedido", req: req });
});

app.get("/ja-cadastrado", (req, res) => {
    console.log("GET /ja-cadastrado");
    res.render("pages/ja-cadastrado", { título: "ja-cadastrado", req: req });
});

app.get("/invalido", (req, res) => {
    console.log("GET /invalido");
    res.render("pages/invalido", { título: "invalido", req: req });
});

app.get("/unauthorized", (req, res) => {
    console.log("GET /unauthorized");
    res.render("pages/unauthorized", { título: "Unauthorized", req: req });
});

app.get("/dashboard", (req, res) => {
    console.log("GET /dashboard");
    if (req.session.loggedin) {
        db.all("SELECT * FROM users", [], (err, row) => {
            if (err) throw err;
            console.log(JSON.stringify(row));
            res.render("pages/dashboard", { titulo: "Tabela de usuário", dados: row, req: req });
    });

    } else {
        res.redirect("/unauthorized");
    }
});

app.get("/postagens", (req, res) => {
    console.log("GET /postagens");
    const search = req.query.search || "";
    let query = "SELECT * FROM posts";
    let params = [];

    if (search) {
        query = `SELECT * FROM posts WHERE titulo LIKE ? OR conteudo LIKE ?`;
        params = [`%${search}%`, `%${search}%`];
    }

    db.all(query, params, (err, row) => {
        if (err) throw err;
        res.render("pages/postagens", {
            titulo: "Tabela de posts",
            dados: row,
            search: search,
            req: req
        });
    });
});

app.post("/deletar/:id", (req, res) => {
    if (!req.session.adm) {
        return res.status(403).send("Acesso negado");
    }

    const id = req.params.id;
    const query = "DELETE FROM posts WHERE id = ?";
    db.run(query, [id], function (err) {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao deletar");
        }
        res.redirect("/postagens");
    });
});

app.get("/logout", (req, res) => {
    console.log("GET /logout");
    req.session.destroy(() => {
        res.redirect("/");
    });
});

app.get("/post_create", (req, res) => {
    console.log("GET /post_create");
    if (req.session.loggedin) {
        res.render("pages/post_form", { titulo: "Criar postagens", req: req });
    } else {
        res.redirect("/invalido");
    }
});

app.post("/post_create", (req, res) => {
    console.log("POST /post_create");
    if (req.session.loggedin) {
        const { titulo, conteudo } = req.body;
        const data = new Date();
        const data_criacao = data.toLocaleDateString();

        const query = "INSERT INTO posts (id_users, titulo, conteudo, data_criacao) VALUES (?, ?, ?, ?)";
        db.run(query, [req.session.id_username, titulo, conteudo, data_criacao], (err) => {
            if (err) throw err;
            res.redirect("/postagens");
        });
    } else {
        res.redirect("/invalido");
    }
});

// Rota 404
app.use('/{*erro}', (req, res) => {
    //Envia uma resposta de erro 404
    console.log("GET /erro_404")
    res.status(404).render('pages/erro404', { título: "HTTP ERROR 404 - PAGE NOT FOUND", req: req, msg: "404" });
});


app.listen(PORT, () => {
    console.log(`Servidor executando na porta ${PORT}`);
    console.log(__dirname + '//static');
});
