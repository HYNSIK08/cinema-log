/**
 * Cinema Log - 상세페이지 스크립트 (detail.js)
 */

// URL 쿼리 스트링에서 게시글 ID 추출
const urlParams = new URLSearchParams(window.location.search);
const movieId = urlParams.get('id');

let currentIsHidden = 0;
let currentMovie = null;

/**
 * 1. 관리자 권한 확인 (localStorage)
 */
function checkAdmin() {
    return localStorage.getItem('isAdmin') === 'true';
}

/**
 * 2. 즐겨찾기(북마크) 관련 함수
 */
// 저장된 즐겨찾기 ID 목록 가져오기
function getBookmarks() {
    try {
        return JSON.parse(localStorage.getItem('cinema_bookmarks') || '[]');
    } catch (e) {
        console.error('Bookmark parse error:', e);
        return [];
    }
}

// 즐겨찾기 UI 상태 업데이트
function updateBookmarkBtn() {
    const btn = document.getElementById('bookmarkBtn');
    if (!btn) return;

    const bookmarks = getBookmarks();
    if (bookmarks.includes(String(movieId))) {
        btn.innerText = '★ 즐겨찾기됨';
        btn.style.borderColor = '#f1c40f';
        btn.style.background = 'rgba(241, 196, 15, 0.2)';
    } else {
        btn.innerText = '☆ 즐겨찾기';
        btn.style.borderColor = 'var(--border-color)';
        btn.style.background = 'none';
    }
}

// 즐겨찾기 추가/해제 토글
function toggleBookmark() {
    if (!movieId) return;

    let bookmarks = getBookmarks();
    const strId = String(movieId);

    if (bookmarks.includes(strId)) {
        bookmarks = bookmarks.filter(id => id !== strId);
        alert('즐겨찾기에서 해제되었습니다.');
    } else {
        bookmarks.push(strId);
        alert('즐겨찾기에 추가되었습니다!');
    }

    localStorage.setItem('cinema_bookmarks', JSON.stringify(bookmarks));
    updateBookmarkBtn();
}

/**
 * 3. 영화 상세 정보 불러오기 (조회수 자동 증가 포함)
 */
async function loadDetail() {
    if (!movieId) {
        alert('잘못된 접근입니다.');
        window.location.href = 'index.html';
        return;
    }

    try {
        // 서버의 GET /api/movies/:id 호출 (서버에서 views = views + 1 자동 처리)
        const response = await fetch(`/api/movies/${movieId}`);
        
        if (response.ok) {
            currentMovie = await response.json();

            // DOM 요소를 안전하게 채움
            const titleEl = document.getElementById('movieTitle');
            const genreEl = document.getElementById('movieGenre');
            const writerEl = document.getElementById('movieWriter');
            const viewsEl = document.getElementById('movieViews');
            const likesEl = document.getElementById('movieLikes');
            const contentEl = document.getElementById('movieContent');
            const editBtn = document.getElementById('editBtn');

            if (titleEl) titleEl.innerText = currentMovie.title;
            if (genreEl) genreEl.innerText = currentMovie.genre || '기타';
            if (writerEl) writerEl.innerText = currentMovie.writer;
            if (viewsEl) viewsEl.innerText = currentMovie.views;
            if (likesEl) likesEl.innerText = currentMovie.likes || 0;
            if (contentEl) contentEl.innerText = currentMovie.content;
            if (editBtn) editBtn.href = `editForm.html?id=${currentMovie.id}`;

            currentIsHidden = currentMovie.isHidden;
            const hideBtn = document.getElementById('hideBtn');
            if (hideBtn) {
                hideBtn.innerText = currentIsHidden ? "숨김 해제 (관리자)" : "게시글 숨기기 (관리자)";
            }

            // 관리자 모드 여부에 따른 UI 노출
            if (checkAdmin()) {
                document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'inline-block');
            }

            // 즐겨찾기 상태 반영
            updateBookmarkBtn();

            // 연관 감상평(같은 제목/장르) 조회 실행
            loadRelatedMovies(currentMovie.title, currentMovie.genre, currentMovie.id);
        } else {
            alert('해당 감상평을 찾을 수 없습니다.');
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('상세 정보 로드 실패:', error);
    }
}

/**
 * 4. 연관 감상평 목록 불러오기 (제목 일치 OR 장르 일치)
 */
async function loadRelatedMovies(title, genre, currentId) {
    const relatedListEl = document.getElementById('relatedList');
    if (!relatedListEl) return;

    try {
        const res = await fetch(`/api/movies?isAdmin=${checkAdmin()}`);
        if (res.ok) {
            const allMovies = await res.json();

            // 조건: 현재 글 제외 + (제목 일치 OR 장르 일치)
            const related = allMovies.filter(m => 
                String(m.id) !== String(currentId) && 
                (m.title === title || (genre && m.genre === genre))
            );

            relatedListEl.innerHTML = '';
            if (related.length === 0) {
                relatedListEl.innerHTML = '<div style="color:var(--text-sub); font-size:14px;">연관된 다른 감상평이 없습니다.</div>';
                return;
            }

            // 상위 5개 연관 게시글 생성
            related.slice(0, 5).forEach(item => {
                const matchType = item.title === title ? '🎬 동일 제목' : '🏷️ 동일 장르';
                const a = document.createElement('a');
                a.className = 'related-item';
                a.href = `detail.html?id=${item.id}`;
                a.innerHTML = `
                    <div>
                        <span class="rel-title">${item.title}</span> 
                        <span style="font-size:12px; color:var(--accent-color); margin-left:6px;">[${matchType}]</span>
                    </div>
                    <div class="rel-meta">✍️ ${item.writer} | 👍 ${item.likes || 0}</div>
                `;
                relatedListEl.appendChild(a);
            });
        }
    } catch (err) {
        console.error('연관 글 로드 실패:', err);
        relatedListEl.innerHTML = '<div style="color:var(--text-sub); font-size:14px;">연관 글을 불러오지 못했습니다.</div>';
    }
}

/**
 * 5. 추천(좋아요) 처리
 */
async function likeMovie() {
    if (!movieId) return;
    try {
        const response = await fetch(`/api/movies/${movieId}/like`, { method: 'POST' });
        if (response.ok) {
            const data = await response.json();
            const likesEl = document.getElementById('movieLikes');
            if (likesEl) likesEl.innerText = data.likes;
            alert('추천되었습니다!');
        } else {
            alert('추천 처리 중 오류가 발생했습니다.');
        }
    } catch (error) {
        console.error('추천 실패:', error);
    }
}

/**
 * 6. 게시글 숨기기 토글 (관리자 전용)
 */
async function toggleHide() {
    if (!checkAdmin()) return alert('관리자 권한이 필요합니다.');
    const targetState = currentIsHidden ? 0 : 1;
    try {
        const response = await fetch(`/api/movies/${movieId}/hide`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isHidden: targetState })
        });
        if (response.ok) {
            alert(targetState ? '게시글이 숨김 처리되었습니다.' : '게시글 숨김이 해제되었습니다.');
            location.reload();
        }
    } catch (error) {
        console.error('숨김 처리 실패:', error);
    }
}

/**
 * 7. 게시글 삭제 (관리자 전용)
 */
async function deleteMovie() {
    if (!checkAdmin()) return alert('관리자 권한이 필요합니다.');
    if (confirm("정말로 이 기록을 삭제하시겠습니까?")) {
        try {
            const response = await fetch(`/api/movies/${movieId}`, { method: 'DELETE' });
            if (response.ok) {
                alert("삭제되었습니다.");
                window.location.href = "index.html";
            }
        } catch (error) {
            console.error('삭제 실패:', error);
        }
    }
}
function deleteMovie() {
    if (!checkAdmin()) return alert('관리자 권한이 필요합니다.');

    if (confirm("정말 삭제하시겠습니까?")) {
        fetch(`/api/movies/${movieId}`, {
            method: 'DELETE'
        })
        .then(res => {
            if (res.ok) {
                alert("삭제되었습니다.");
                location.href = "index.html";
            } else {
                alert("삭제 실패");
            }
        });
    }
}


function editMovie(id) {
    location.href = `addForm.html?id=${id}`;
}

async function deleteMovie(id){

    if(!confirm("삭제하시겠습니까?"))
        return;

    const res=await fetch(`/api/movies/${id}`,{

        method:"DELETE"

    });

    if(res.ok){

        alert("삭제되었습니다.");

        location.href="index.html";

    }

}


window.onload = loadDetail;