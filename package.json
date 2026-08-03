const express = require('express');
const path = require('path');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// [핵심] public 폴더의 정적 파일(index.html, addForm.html 등) 제공
app.use(express.static(path.join(__dirname, 'public')));

// SQLite DB 연결 (SQLite 메모리 또는 파일 DB)
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) console.error('DB 연결 실패:', err.message);
    else console.log('SQLite DB 연결 성공');
});

// 테이블 생성
db.run(`CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    genre TEXT,
    writer TEXT,
    content TEXT,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0
)`);

// 1. 루트 경로(/) 접속 시 index.html 제공
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 2. 전체 감상평 목록 조회 API
app.get('/api/movies', (req, res) => {
    db.all("SELECT * FROM movies ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 3. 단일 감상평 상세 조회 API (조회수 증가 포함)
app.get('/api/movies/:id', (req, res) => {
    const id = req.params.id;
    db.run("UPDATE movies SET views = views + 1 WHERE id = ?", [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        db.get("SELECT * FROM movies WHERE id = ?", [id], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(row);
        });
    });
});

// 4. 감상평 등록 API
app.post('/api/movies', (req, res) => {
    const { title, genre, writer, content } = req.body;
    const sql = "INSERT INTO movies (title, genre, writer, content) VALUES (?, ?, ?, ?)";
    db.run(sql, [title, genre, writer, content], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: "저장 성공" });
    });
});

// 5. 추천수 증가 API
app.post('/api/movies/:id/like', (req, res) => {
    const id = req.params.id;
    db.run("UPDATE movies SET likes = likes + 1 WHERE id = ?", [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "추천 성공" });
    });
});

// 서버 실행
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});