# Cinema Log - Spring Boot 변환본

기존 Express 서버의 API 경로와 응답 구조를 유지하면서 Spring Boot로 변환한 프로젝트입니다.

## 기본 실행(H2 내장 DB)

```bash
# Windows
mvn spring-boot:run

# macOS/Linux
mvn spring-boot:run
```

브라우저: http://localhost:8080

기본 관리자 계정은 `hyunsik / 7356`이며 환경 변수로 변경할 수 있습니다.

## TMDB 사용

TMDB 키를 소스에 저장하지 않고 환경 변수로 설정합니다.

Windows PowerShell:
```powershell
$env:TMDB_API_KEY="본인의_TMDB_API_KEY"
.\mvn spring-boot:run
```

## MySQL 실행

```bash
SPRING_PROFILES_ACTIVE=mysql \
MYSQL_HOST=localhost MYSQL_PORT=3306 \
MYSQL_DATABASE=cinemalog MYSQL_USER=root MYSQL_PASSWORD=1234 \
TMDB_API_KEY=본인의키 \
mvn spring-boot:run
```

또는 Docker가 설치되어 있다면 `.env`에 `TMDB_API_KEY=...`를 저장한 뒤:

```bash
docker compose up --build
```

## 주요 구조

- `controller`: 로그인, 영화 CRUD, TMDB 프록시 API
- `service`: 비즈니스 로직과 트랜잭션
- `repository`: Spring Data JPA
- `entity`: movies 테이블 매핑
- `resources/static`: 기존 HTML/JS/이미지
- `application.yml`: 즉시 실행 가능한 H2 설정
- `application-mysql.yml`: MySQL 프로필 설정
