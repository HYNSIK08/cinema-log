const express = require('express');
const path = require('path');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

// TMDB API 설정
const TMDB_API_KEY = '0de30fcff153e1d01942f9fe2e563d0b';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 제공
app.use(express.static(__dirname));
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

// 메인 페이지 라우팅
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 🔒 관리자 계정 정보 (변경 가능)
let ADMIN_ID = "hyunsik";
let ADMIN_PW = "7356";

// ----------------------------------------------------
// 🔐 관리자 계정 API
// ----------------------------------------------------

// 1. 관리자 로그인
app.post('/api/login', (req, res) => {
    const { id, password } = req.body;
    if (id === ADMIN_ID && password === ADMIN_PW) {
        res.json({ success: true, message: "관리자 인증 성공" });
    } else {
        res.status(401).json({ success: false, message: "아이디 또는 비밀번호가 올바르지 않습니다." });
    }
});

// 2. 관리자 계정 정보 변경
app.post('/api/admin/change', (req, res) => {
    const { currentPassword, newId, newPassword } = req.body;

    if (currentPassword !== ADMIN_PW) {
        return res.status(401).json({ success: false, message: "현재 비밀번호가 일치하지 않습니다." });
    }

    if (!newId || !newPassword) {
        return res.status(400).json({ success: false, message: "새로운 아이디와 비밀번호를 입력해주세요." });
    }

    ADMIN_ID = newId.trim();
    ADMIN_PW = newPassword.trim();

    console.log(`[보안] 관리자 계정이 변경되었습니다. (새 ID: ${ADMIN_ID})`);
    res.json({ success: true, message: "관리자 정보가 성공적으로 변경되었습니다!" });
});

// ----------------------------------------------------
// 🎬 영화 감상평 CRUD API
// ----------------------------------------------------

// 감상평 전체 목록 조회
app.get('/api/movies', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM movies ORDER BY id DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "DB 조회 오류" });
    }
});

// 단일 감상평 상세 조회 및 조회수 증가
app.get('/api/movies/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('UPDATE movies SET views = views + 1 WHERE id = ?', [id]);
        const [rows] = await pool.query('SELECT * FROM movies WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: "DB 조회 오류" });
    }
});

// 감상평 추가
app.post('/api/movies', async (req, res) => {
    const { title, genre, writer, content } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO movies (title, genre, writer, content, views, likes, isHidden) VALUES (?, ?, ?, ?, 0, 0, 0)',
            [title, genre || '기타', writer || '익명', content]
        );
        res.json({ success: true, id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: "DB 등록 오류" });
    }
});

// 추천수(좋아요) 증가
app.post('/api/movies/:id/like', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('UPDATE movies SET likes = likes + 1 WHERE id = ?', [id]);
        const [rows] = await pool.query('SELECT likes FROM movies WHERE id = ?', [id]);
        res.json({ success: true, likes: rows[0].likes });
    } catch (err) {
        res.status(500).json({ error: "DB 업데이트 오류" });
    }
});

// 게시글 숨김 토글 (관리자)
app.post('/api/movies/:id/toggle-hide', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('UPDATE movies SET isHidden = NOT isHidden WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "DB 업데이트 오류" });
    }
});

// 게시글 삭제 (관리자)
app.delete('/api/movies/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM movies WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "DB 삭제 오류" });
    }
});

// 게시글 전체 삭제 (관리자)
app.delete('/api/movies', async (req, res) => {
    try {
        await pool.query('DELETE FROM movies');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "DB 초기화 오류" });
    }
});

// ----------------------------------------------------
// 🍿 TMDB API 연동 Proxy
// ----------------------------------------------------
app.get('/api/tmdb/popular', async (req, res) => {
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=ko-KR&page=1`);
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "TMDB API 호출 실패" });
    }
});

app.get('/api/tmdb/search', async (req, res) => {
    const { query } = req.query;
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&language=ko-KR&query=${encodeURIComponent(query)}`);
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "TMDB API 검색 실패" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 서버가 포트 ${PORT}에서 정상 동작 중입니다.`);
});