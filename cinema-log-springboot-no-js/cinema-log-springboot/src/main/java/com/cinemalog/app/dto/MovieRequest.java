package com.cinemalog.app.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MovieRequest(
        @NotBlank(message = "영화 제목은 필수입니다.")
        @Size(max = 255, message = "영화 제목은 255자 이하여야 합니다.")
        String title,
        @Size(max = 100, message = "장르는 100자 이하여야 합니다.")
        String genre,
        @Size(max = 100, message = "작성자는 100자 이하여야 합니다.")
        String writer,
        String content
) {}
