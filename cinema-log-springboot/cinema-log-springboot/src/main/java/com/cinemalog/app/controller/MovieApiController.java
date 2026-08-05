package com.cinemalog.app.controller;

import com.cinemalog.app.dto.HideRequest;
import com.cinemalog.app.dto.MovieRequest;
import com.cinemalog.app.entity.Movie;
import com.cinemalog.app.service.MovieService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/movies")
public class MovieApiController {
    private final MovieService movieService;

    public MovieApiController(MovieService movieService) {
        this.movieService = movieService;
    }

    @GetMapping
    public List<Movie> list(@RequestParam(defaultValue = "") String search,
                            @RequestParam(defaultValue = "") String genre,
                            @RequestParam(defaultValue = "false") boolean isAdmin) {
        return movieService.findAll(search, genre, isAdmin);
    }

    @GetMapping("/{id}")
    public Movie detail(@PathVariable Long id) {
        return movieService.findAndIncreaseViews(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> create(@Valid @RequestBody MovieRequest request) {
        Movie saved = movieService.create(request);
        return Map.of("id", saved.getId(), "message", "저장 성공");
    }

    @PutMapping("/{id}")
    public Map<String, String> update(@PathVariable Long id, @Valid @RequestBody MovieRequest request) {
        movieService.update(id, request);
        return Map.of("message", "수정 성공");
    }

    @PostMapping("/{id}/like")
    public Map<String, Integer> like(@PathVariable Long id) {
        return Map.of("likes", movieService.like(id));
    }

    @PatchMapping({"/{id}/toggle-hide", "/{id}/hide"})
    public Map<String, String> toggleHide(@PathVariable Long id, @RequestBody HideRequest request) {
        movieService.setHidden(id, request.hidden());
        return Map.of("message", "상태 변경 성공");
    }

    @DeleteMapping("/{id}")
    public Map<String, String> delete(@PathVariable Long id) {
        movieService.delete(id);
        return Map.of("message", "삭제 완료");
    }

    @DeleteMapping
    public Map<String, String> deleteAll() {
        movieService.deleteAll();
        return Map.of("message", "전체 삭제 완료");
    }
}
