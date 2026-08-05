package com.cinemalog.app.controller;

import com.cinemalog.app.dto.LoginRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/login")
public class AuthController {
    private final String adminId;
    private final String adminPassword;

    public AuthController(@Value("${app.admin.id}") String adminId,
                          @Value("${app.admin.password}") String adminPassword) {
        this.adminId = adminId;
        this.adminPassword = adminPassword;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest request) {
        boolean success = adminId.equals(request.id()) && adminPassword.equals(request.password());
        if (success) {
            return ResponseEntity.ok(Map.of("success", true, "message", "관리자 인증 성공"));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("success", false, "message", "비밀번호 오류"));
    }
}
