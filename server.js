const express = require('express');
const path = require('path');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

// TMDB API 키 및 URL 직접 지정
const TMDB_API_KEY = '0de30fcff153e1d01942f9fe2e563d0b';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 경로 지정
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));

// Clever Cloud MySQL 연결
const pool = mysql.createPool({
    host: process.env.MYSQLHOST || process.env.MYSQL_ADDON_HOST || 'localhost',
    user: process.env.MYSQLUSER || process.env.MYSQL_ADDON_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.MYSQL_ADDON_PASSWORD || '',
    database: process.env.MYSQLDATABASE || process.env.MYSQL_ADDON_DB || 'cinemalog',
    port: process.env.MYSQLPORT || process.env.MYSQL_ADDON_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// DB 테이블 생성
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
                isHidden TINYINT DEFAULT 0,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        connection.release();
        console.log('✅ MySQL 연결 및 테이블 생성 완료');
    } catch (err) {
        console.error('⚠️ MySQL DB 연결 안 됨 (로컬 스토리지 모드 가능):', err.message);
    }
}
initDB();

const ADMIN_ID = "hyunsik";
const ADMIN_PW = "7356";

// ----------------------------------------------------
// 🎬 TMDB API 직접 호출 엔드포인트
// ----------------------------------------------------

// TMDB 인기 영화 (API 키 파라미터 직접 사용)
app.get('/api/tmdb/popular', async (req, res) => {
    try {
        const url = `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=ko-KR&page=1`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`TMDB HTTP Error: ${response.status}`);
        }
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('TMDB Popular fetch error:', error.message);
        res.status(500).json({ error: 'TMDB 데이터를 가져오지 못했습니다.', results: [] });
    }
});

// TMDB 영화 검색 (API 키 파라미터 직접 사용)
app.get('/api/tmdb/search', async (req, res) => {
    const query = req.query.query;
    if (!query) {
        return res.status(400).json({ error: '검색어가 필요합니다.' });
    }
    try {
        const url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&language=ko-KR&query=${encodeURIComponent(query)}&page=1`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`TMDB HTTP Error: ${response.status}`);
        }
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('TMDB Search fetch error:', error.message);
        res.status(500).json({ error: 'TMDB 검색을 진행할 수 없습니다.', results: [] });
    }
});

// ----------------------------------------------------
// 📝 서비스 API
// ----------------------------------------------------

app.post('/api/login', (req, res) => {
    const { id, password } = req.body;
    if (id === ADMIN_ID && password === ADMIN_PW) {
        res.json({ success: true, message: "관리자 인증 성공" });
    } else {
        res.status(401).json({ success: false, message: "아이디 또는 비밀번호가 올바르지 않습니다." });
    }
});

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

app.patch('/api/movies/:id/toggle-hide', async (req, res) => {
    const { id } = req.params;
    const { isHidden } = req.body;
    try {
        await pool.query("UPDATE movies SET isHidden = ? WHERE id = ?", [isHidden ? 1 : 0, id]);
        res.json({ message: "숨김 상태 변경 완료" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/movies/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("DELETE FROM movies WHERE id = ?", [id]);
        res.json({ message: "삭제 완료" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/movies', async (req, res) => {
    try {
        await pool.query("TRUNCATE TABLE movies");
        res.json({ message: "전체 삭제 완료" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});