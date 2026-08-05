# Cinema Log - Spring Boot MVC (JavaScript-free)

브라우저 JavaScript 없이 Spring MVC + Thymeleaf + HTML form으로 동작하는 버전입니다.

## 주요 변경
- 기존 `static/*.html`, `detail.js`, 인라인 `<script>` 제거
- 화면을 `src/main/resources/templates`의 Thymeleaf 템플릿으로 전환
- `fetch()` REST 호출을 Spring MVC Controller와 HTML form POST로 전환
- localStorage 관리자 인증을 HttpSession 인증으로 전환
- localStorage 즐겨찾기를 HttpSession 기반 즐겨찾기로 전환
- TMDB 검색/인기 목록을 서버에서 호출하여 Thymeleaf로 렌더링

## 실행
```bash
mvn spring-boot:run
```
접속: http://localhost:8080

TMDB 기능을 사용하려면 `TMDB_API_KEY` 환경 변수를 설정하세요.
