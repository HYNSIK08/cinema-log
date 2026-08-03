package com.example.demo.domain;

import java.time.LocalDateTime;

public class MovieRecord {
    private Long id;
    private String title;       // 영화 제목 (스파이더맨: 브랜드 뉴 데이)
    private String writer;      // 작성자/기록자
    private String content;     // 장르 및 감상평 내용
    private int viewCount;      // [도전형] 조회수
    private LocalDateTime regDate;

    public MovieRecord() {}

    public MovieRecord(Long id, String title, String writer, String content) {
        this.id = id;
        this.title = title;
        this.writer = writer;
        this.content = content;
        this.viewCount = 0;
        this.regDate = LocalDateTime.now();
    }

    // Getter & Setter
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getWriter() { return writer; }
    public void setWriter(String writer) { this.writer = writer; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public int getViewCount() { return viewCount; }
    public void setViewCount(int viewCount) { this.viewCount = viewCount; }

    public LocalDateTime getRegDate() { return regDate; }
    public void setRegDate(LocalDateTime regDate) { this.regDate = regDate; }
}