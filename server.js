const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// SQLite DB 연결
const db = new sqlite3.Database('./cinema.db', (err) => {
    if (err) {
        console.error('DB 연결 실패:', err.message);
    } else {
        console.log('SQLite DB 연결 성공!');
    }
});

// 테이블 자동 생성
db.run(`
    CREATE TABLE IF NOT EXISTS movies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        writer TEXT NOT NULL,
        content TEXT NOT NULL,
        views INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// API 엔드포인트
app.get('/api/movies', (req, res) => {
    const search = req.query.search || '';
    const sql = `SELECT * FROM movies WHERE title LIKE ? ORDER BY id DESC`;
    db.all(sql, [`%${search}%`], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/movies/:id', (req, res) => {
    const { id } = req.params;
    db.run(`UPDATE movies SET views = views + 1 WHERE id = ?`, [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        db.get(`SELECT * FROM movies WHERE id = ?`, [id], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.status(404).json({ error: '데이터를 찾을 수 없습니다.' });
            res.json(row);
        });
    });
});

app.post('/api/movies', (req, res) => {
    const { title, writer, content } = req.body;
    const sql = `INSERT INTO movies (title, writer, content) VALUES (?, ?, ?)`;
    db.run(sql, [title, writer, content], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, title, writer, content, views: 0 });
    });
});

app.put('/api/movies/:id', (req, res) => {
    const { id } = req.params;
    const { title, writer, content } = req.body;
    const sql = `UPDATE movies SET title = ?, writer = ?, content = ? WHERE id = ?`;
    db.run(sql, [title, writer, content, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '수정 완료' });
    });
});

app.delete('/api/movies/:id', (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM movies WHERE id = ?`;
    db.run(sql, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '삭제 완료' });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});