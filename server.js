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

// 테이블 생성 및 컬럼 자동 추가 (기존 DB 호환)
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS movies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            writer TEXT NOT NULL,
            genre TEXT DEFAULT '기타',
            content TEXT NOT NULL,
            views INTEGER DEFAULT 0,
            likes INTEGER DEFAULT 0,
            isHidden INTEGER DEFAULT 0,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 기존 DB 테이블이 있는 경우를 대비한 컬럼 추가 예외 처리
    db.run(`ALTER TABLE movies ADD COLUMN genre TEXT DEFAULT '기타'`, () => {});
    db.run(`ALTER TABLE movies ADD COLUMN likes INTEGER DEFAULT 0`, () => {});
    db.run(`ALTER TABLE movies ADD COLUMN isHidden INTEGER DEFAULT 0`, () => {});
});

// 1. 영화 목록 조회 (검색 + 장르 필터 + 숨김글 처리)
app.get('/api/movies', (req, res) => {
    const search = req.query.search || '';
    const genre = req.query.genre || '';
    const isAdmin = req.query.isAdmin === 'true';

    let sql = `SELECT * FROM movies WHERE title LIKE ?`;
    const params = [`%${search}%`];

    if (genre) {
        sql += ` AND genre = ?`;
        params.push(genre);
    }

    // 일반 사용자는 숨겨지지 않은(isHidden = 0) 게시글만 조회 가능
    if (!isAdmin) {
        sql += ` AND isHidden = 0`;
    }

    sql += ` ORDER BY id DESC`;

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 2. 영화 상세 조회 (조회수 증가)
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

// 3. 영화 등록
app.post('/api/movies', (req, res) => {
    const { title, writer, genre, content } = req.body;
    const sql = `INSERT INTO movies (title, writer, genre, content) VALUES (?, ?, ?, ?)`;
    db.run(sql, [title, writer, genre || '기타', content], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, title, writer, genre, content });
    });
});

// 4. 영화 수정
app.put('/api/movies/:id', (req, res) => {
    const { id } = req.params;
    const { title, writer, genre, content } = req.body;
    const sql = `UPDATE movies SET title = ?, writer = ?, genre = ?, content = ? WHERE id = ?`;
    db.run(sql, [title, writer, genre, content, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '수정 완료' });
    });
});

// 5. 추천(좋아요) 증가
app.post('/api/movies/:id/like', (req, res) => {
    const { id } = req.params;
    db.run(`UPDATE movies SET likes = likes + 1 WHERE id = ?`, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        db.get(`SELECT likes FROM movies WHERE id = ?`, [id], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ likes: row.likes });
        });
    });
});

// 6. 게시글 숨기기 / 토글 (관리자 전용)
app.patch('/api/movies/:id/hide', (req, res) => {
    const { id } = req.params;
    const { isHidden } = req.body; // 1: 숨김, 0: 노출
    db.run(`UPDATE movies SET isHidden = ? WHERE id = ?`, [isHidden, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: isHidden ? '숨김 처리 완료' : '숨김 해제 완료' });
    });
});

// 7. 게시글 삭제 (관리자 전용)
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