// imports
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const port = process.env.PORT || 3000;

// criação do app express
const app = express();

// utilização do cors
app.use(cors());

// gerenciamento de dados json
app.use(bodyParser.json());

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'testing'
});

connection.connect((err) => {
    if (err) {
        console.error('Erro ao conectar: ' + err.stack);
        return;
    }
    console.log('Conectado como id ' + connection.threadId);
});

// inserção dos dados do banco
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'testing',
    uri: process.env.MYSQL_URL,
});

// conexão com o MySQL
db.connect(err => {
    if (err) {
        console.error('Erro ao conectar no banco de dados:', err);
        return;
    }
    console.log('Conectado ao banco de dados');
});

app.get('/', (req, res) => {
    res.send('Hello from Express!');
});

// rota de requisição
app.get('/api/dados', (req, res) => {
    db.query('SELECT * FROM reviewdata', (err, results) => {
        if (err) {
            return res.status(500).send('Erro ao consultar banco de dados');
        }
        res.json(results);
    });
});

// rota de pesquisa
app.get('/api/search', (req, res) => {
    const searchTerm = req.query.term;

    if (!searchTerm) {
        return res.status(400).json({ error: 'Termo de pesquisa é obrigatório' });
    }

    const query = 'SELECT * FROM reviewdata WHERE LOWER(review) LIKE ? OR LOWER(first_name) LIKE ? OR LOWER(last_name) LIKE ?';
    db.query(query, [`%${searchTerm.toLowerCase()}%`, `%${searchTerm.toLowerCase()}%`, `%${searchTerm.toLowerCase()}%`], (err, results) => {
        if (err) {
            console.error('Erro ao executar a consulta:', err);
            return res.status(500).json({ error: 'Erro ao realizar a busca' });
        }
        res.json(results);
    });
});

// rota de envio de dados
app.post('/submitForm', (req, res) => {
    const { name, lastName, email, phone, stars, reviewText } = req.body;

    const currentDate = new Date();

    const offset = -3;
    const localDate = new Date(currentDate.setHours(currentDate.getHours() + offset));

    const created_at = localDate.toISOString().slice(0, 19).replace('T', ' ');

    const sql = 'INSERT INTO reviewdata (first_name, last_name, email, phone, stars, review, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [name, lastName, email, phone, stars, reviewText, created_at], (err, result) => {
        if (err) {
            console.error('Erro ao inserir no banco:', err);
            return res.status(500).send('Erro no servidor');
        }
        res.status(200).send('Avaliação enviada com sucesso');
    })
})

// rota de verificação de e-mail e telefone
app.post('/check-user', (req, res) => {
    const { email, phone } = req.body;

    // Verificar se o e-mail já existe
    db.query('SELECT * FROM reviewdata WHERE email = ? OR phone = ?', [email, phone], (err, results) => {
        if (err) {
            console.error('Erro ao consultar banco de dados:', err);
            return res.status(500).json({ error: 'Erro ao verificar usuário' });
        }

        // Se encontrar algum resultado, significa que o e-mail ou telefone já estão registrados
        if (results.length > 0) {
            return res.status(400).json({ message: 'E-mail ou telefone já registrado' });
        }

        return res.status(200).json({ message: 'E-mail e telefone disponíveis' });
    });
});

// definição de porta
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});