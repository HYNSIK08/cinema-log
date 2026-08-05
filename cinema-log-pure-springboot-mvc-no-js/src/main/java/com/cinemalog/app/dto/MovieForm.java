package com.cinemalog.app.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class MovieForm {
    @NotBlank(message = "영화 제목은 필수입니다.")
    @Size(max = 255, message = "영화 제목은 255자 이하여야 합니다.")
    private String title;

    @Size(max = 100, message = "장르는 100자 이하여야 합니다.")
    private String genre;

    @Size(max = 100, message = "작성자는 100자 이하여야 합니다.")
    private String writer;

    private String content;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getGenre() { return genre; }
    public void setGenre(String genre) { this.genre = genre; }
    public String getWriter() { return writer; }
    public void setWriter(String writer) { this.writer = writer; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
