# Cinema Log - 순수 Spring Boot MVC 버전

이 프로젝트는 브라우저 JavaScript를 전혀 사용하지 않습니다.

## 사용 기술
- Java 17
- Spring Boot
- Spring MVC (`@Controller`)
- Thymeleaf 서버 사이드 렌더링
- Spring Data JPA
- H2 기본 실행 / MySQL 프로필 지원
- HTML Form과 HttpSession

## JavaScript 미사용 기준
- `.js` 파일 없음
- `<script>` 태그 없음
- `fetch`, `axios` 없음
- `localStorage`, `sessionStorage` 없음
- `onclick`, `onchange`, `onsubmit` 없음
- `@RestController` 없음

모든 검색, 등록, 수정, 삭제, 좋아요, 관리자 로그인, 즐겨찾기 기능은 Spring MVC Controller와 HTML Form 요청으로 처리됩니다.

## 실행
```bash
mvn spring-boot:run
```

접속: `http://localhost:8080`

## TMDB
```powershell
$env:TMDB_API_KEY="발급받은_API_KEY"
mvn spring-boot:run
```

## MySQL 프로필
```powershell
$env:SPRING_PROFILES_ACTIVE="mysql"
$env:MYSQL_HOST="localhost"
$env:MYSQL_PORT="3306"
$env:MYSQL_DATABASE="cinemalog"
$env:MYSQL_USER="root"
$env:MYSQL_PASSWORD="비밀번호"
mvn spring-boot:run
```
