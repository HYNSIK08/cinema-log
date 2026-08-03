const express = require('express');
const path = require('path');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Clever Cloud MySQL 연결 풀 생성
const pool = mysql.createPool({
    host: process.env.MYSQLHOST || process.env.MYSQL_ADDON_HOST,
    user: process.env.MYSQLUSER || process.env.MYSQL_ADDON_USER,
    password: process.env.MYSQLPASSWORD || process.env.MYSQL_ADDON_PASSWORD,
    database: process.env.MYSQLDATABASE || process.env.MYSQL_ADDON_DB,
    port: process.env.MYSQLPORT || process.env.MYSQL_ADDON_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 테이블 자동 생성 (서버 시작 시 실행)
async function initDB() {
    try {
        const connection = await pool.getConnection();
        await connection.query(`
            CREATE TABLE IF NOT EXISTS movies (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                genre VARCHAR(100),
                writer VARCHAR(100),
                content TEXT,
                views INT DEFAULT 0,
                likes INT DEFAULT 0,
                isHidden TINYINT DEFAULT 0
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        connection.release();
        console.log('MySQL 연결 및 테이블 준비 완료');
    } catch (err) {
        console.error('MySQL DB 연결 실패:', err.message);
    }
}
initDB();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 1. 목록 조회 (검색, 장르, 관리자 필터 포함)
app.get('/api/movies', async (req, res) => {
    const { search, genre, isAdmin } = req.query;
    let sql = "SELECT * FROM movies WHERE 1=1";
    const params = [];

    if (isAdmin !== 'true') {
        sql += " AND isHidden = 0";
    }
    if (search) {
        sql += " AND title LIKE ?";
        params.push(`%${search}%`);
    }
    if (genre) {
        sql += " AND genre = ?";
        params.push(genre);
    }
    sql += " ORDER BY id DESC";

    try {
        const [rows] = await pool.query(sql, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. 단일 상세 조회
app.get('/api/movies/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("UPDATE movies SET views = views + 1 WHERE id = ?", [id]);
        const [rows] = await pool.query("SELECT * FROM movies WHERE id = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. 등록
app.post('/api/movies', async (req, res) => {
    const { title, genre, writer, content } = req.body;
    const sql = "INSERT INTO movies (title, genre, writer, content) VALUES (?, ?, ?, ?)";
    try {
        const [result] = await pool.query(sql, [title, genre, writer, content]);
        res.json({ id: result.insertId, message: "저장 성공" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. 수정
app.put('/api/movies/:id', async (req, res) => {
    const { id } = req.params;
    const { title, genre, writer, content } = req.body;
    const sql = "UPDATE movies SET title = ?, genre = ?, writer = ?, content = ? WHERE id = ?";
    try {
        await pool.query(sql, [title, genre, writer, content, id]);
        res.json({ message: "수정 성공" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. 추천
app.post('/api/movies/:id/like', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("UPDATE movies SET likes = likes + 1 WHERE id = ?", [id]);
        const [rows] = await pool.query("SELECT likes FROM movies WHERE id = ?", [id]);
        res.json({ likes: rows[0].likes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. 숨김 처리 (PATCH)
app.patch('/api/movies/:id/hide', async (req, res) => {
    const { id } = req.params;
    const { isHidden } = req.body;
    try {
        await pool.query("UPDATE movies SET isHidden = ? WHERE id = ?", [isHidden, id]);
        res.json({ message: "숨김 상태 변경 완료" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. 삭제
app.delete('/api/movies/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("DELETE FROM movies WHERE id = ?", [id]);
        res.json({ message: "삭제 완료" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});