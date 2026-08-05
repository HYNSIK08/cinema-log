package com.cinemalog.app.exception;

import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.server.ResponseStatusException;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(NotFoundException.class)
    public String notFound(NotFoundException exception, Model model) {
        model.addAttribute("status", 404);
        model.addAttribute("message", exception.getMessage());
        return "error";
    }

    @ExceptionHandler(ResponseStatusException.class)
    public String externalApiError(ResponseStatusException exception, Model model) {
        model.addAttribute("status", exception.getStatusCode().value());
        model.addAttribute("message", exception.getReason() == null ? "요청 처리 중 오류가 발생했습니다." : exception.getReason());
        return "error";
    }

    @ExceptionHandler(Exception.class)
    public String unexpected(Exception exception, Model model) {
        model.addAttribute("status", 500);
        model.addAttribute("message", "서버에서 요청을 처리하지 못했습니다.");
        return "error";
    }
}
