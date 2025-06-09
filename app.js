const express = require("express");
const session = require("express-session");
const sqlite3 = require("sqlite3");
//const bodyparser = require("body-parser");

const app = express();

const PORT = 4000;

//Conexao com o Banco de Dados
const db = new sqlite3.Database("users.db");

db.serialize(() => {
    db.run(
        "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT)"
    )
    db.run(
        "CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, id_users INTEGRE, titulo TEXT, conteudo TEXT, data_criacao TEXT)"
    )
});

app.use(
    session({
        secret: "senhaforte",
        resave: true,
        saveUninnitialized: true,
    })
)

app.use('/static', express.static(__dirname + '/static'));


//app.use(bodyparser.urlencoded({extended: true})); //versão express 4
app.use(express.urlencoded({ extended: true })); //versão express 5

app.set('view engine', 'ejs');

app.get("/", (req, res) => {
    console.log("GET /");
    res.render("./pages/index", { titulo: "Index", req: req });
});

app.get("/sobre", (req, res) => {
    console.log("GET /sobre")
    res.render("./pages/sobre", { titulo: "Sobre", req: req });
});

app.get("/cadastro", (req, res) => {
    console.log("GET /cadastro")
    res.render("./pages/cadastro", { titulo: "Cadastro", req: req });
});

app.post("/cadastro", (req, res) => {
    console.log("POST /cadastro")
    console.log(JSON.stringify(req.body));
    const { username, password } = req.body;

    const query = "SELECT * FROM users WHERE username=?"

    db.get(query, [username], (err, row) => {
        if (err) throw err;

        //1. Verificar se o usuário existe
        console.log("Query SELECT do Cadastro:", JSON.stringify(row));
        if (row) {
            //2. Se o usuário existir e a senha é válida no BD, executar processo de login
            console.log(`Usuário: ${username} já cadastrado.`);
            res.redirect("/ja-cadastrado")
        } else {
            //3. Se não, executar processo de negação de login
            const insert = "INSERT INTO users (username, password) VALUES (?,?)"
            db.get(insert, [username, password], (err, row) => {
                if (err) throw err;

                console.log(`Usuário: ${username} cadastrado com sucesso.`)
                res.redirect("/cadastro-sucedido");
            })
        }

    })

});

app.get("/login", (req, res) => {
    console.log("GET /login")
    res.render("./pages/login", { titulo: "Login", req: req });
});

app.post("/login", (req, res) => {
    console.log("POST /login")
    console.log(JSON.stringify(req.body));
    const { username, password } = req.body;

    const query = "SELECT * FROM users WHERE username=? AND password=?"
    db.get(query, [username, password], (err, row) => {
        if (err) throw err;

        //1. Verificar se o usuário existe
        console.log(JSON.stringify(row));
        if (row) {
            console.log("SELECT da tabela users:", row);
            //2. Se o usuário existir e a senha é válida no BD, executar processo de login
            req.session.loggedin = true;
            req.session.username = username;
            req.session.id_username = row.id;
            res.redirect("/dashboard");
        } else {
            //3. Se não, executar processo de negação de login
            res.redirect("/invalido");
            //res.send("Usuário inválido");
        }


    });


});

app.get("/cadastro-sucedido", (req, res) => {
    res.render("pages/cadastro-sucedido", { título: "cadastro-sucedido", req: req });
    console.log("GET /cadastro-sucedido");
});

app.get("/ja-cadastrado", (req, res) => {
    res.render("pages/ja-cadastrado", { título: "ja-cadastrado", req: req });
    console.log("GET /ja-cadastrado");
});

app.get("/invalido", (req, res) => {
    res.render("pages/invalido", { título: "invalido", req: req });
    console.log("GET /invalido");
});

app.get("/unauthorized", (req, res) => {
    res.render("pages/unauthorized", { título: "Unauthorized", req: req });
    console.log("GET /unauthorized");
});

//Rota '/dashboard' para o método GET /dashboard
app.get("/dashboard", (req, res) => {
    console.log("GET /dashboard")

    if (req.session.loggedin) {

        //Listar todos os usuários
        const query = "SELECT * FROM users";
        db.all(query, [], (err, row) => {
            if (err) throw err;
            console.log(JSON.stringify(row));
            // Renderiza a página dashboard com a lista de usuário coletadaa do BD pelo SELECT
            res.render("pages/dashboard", { titulo: "Tabela de usuário", dados: row, req: req });
        })
    } else {
        res.redirect("/unauthorized");

    }
    console.log("GET/dashboard");
});

app.get("/postagens", (req, res) => {
    console.log("GET /postagens")

    const search = req.query.search || ""; // pegar o termo de busca (se houver)

    let query;
    let params = [];

    if (search) {
        query = `SELECT * FROM posts WHERE titulo LIKE ? OR conteudo LIKE ?`;
        params = [`%${search}%`, `%${search}%`];
    } else {
        query = `SELECT * FROM posts`;
    }

    db.all(query, params, (err, row) => {
        if (err) throw err;
        console.log(JSON.stringify(row));
        res.render("pages/postagens", {
            titulo: "Tabela de posts",
            dados: row,
            search: search,
            req: req
        });
    });
});

app.get("/logout", (req, res) => {
    console.log("GET /logout");
    req.session.destroy(() => {
        res.redirect("/login");
    })
})

app.get("/post_create", (req, res) => {
    console.log("GET /post_create");
    // Verificar se o usuário está logado
    if (req.session.loggedin) {
        // Se estiver logado, envie o formulário para criação do Post
        res.render("pages/post_form", { titulo: "Criar postagens", req: req });
    } else {
        // Se não estiver logado, redirect para /invalid_user
        res.redirect("/invalido");
    }

});

app.post("/post_create", (req, res) => {
    console.log("POST /post_create");
    //Pegar dados da postagem: UserID, Título Postagem, Conteúdo, Data da postagem 
    //req.session.username, req.session.id_username
    if (req.session.loggedin) {
        console.log("Dados da postagem:", req.body);
        const { titulo, conteudo } = req.body;
        const data = new Date();
        const data_criacao = data.toLocaleDateString();
        console.log("Data de Criação", data_criacao, "Username", req.session.username,
            "id_username: ", req.session.id_username);

        const query = "INSERT INTO posts (id_users, titulo, conteudo, data_criacao) VALUES (?, ?, ?, ?)";

        db.get(query, [req.session.id_username, titulo, conteudo, data_criacao], (err) => {
            if (err) throw err;
            res.redirect("/postagens");
        });

    } else {
        res.redirect("/invalido");
    }

});

app.use('/{*erro}', (req, res) => {
    // Envia uma resposta de erro 404
    res.status(404).render('pages/erro404', { titulo: "ERRO 404", req: req, msg: "404" });
});


app.listen(PORT);

app.listen(PORT, () => {
    console.log(`Servidor sendo executado na porta ${PORT}`);
    console.log(__dirname + "\\static");
});