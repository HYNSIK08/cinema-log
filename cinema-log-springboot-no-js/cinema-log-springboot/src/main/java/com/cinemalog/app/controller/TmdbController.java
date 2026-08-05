package com.cinemalog.app.controller;

import com.cinemalog.app.service.TmdbService;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/tmdb")
public class TmdbController {
    private final TmdbService tmdbService;

    public TmdbController(TmdbService tmdbService) { this.tmdbService = tmdbService; }

    @GetMapping("/popular")
    public Map<?, ?> popular() { return tmdbService.popular(); }

    @GetMapping("/search")
    public Map<?, ?> search(@RequestParam String query) { return tmdbService.search(query); }

    @GetMapping("/movie/{id}")
    public Map<?, ?> detail(@PathVariable Long id) { return tmdbService.detail(id); }
}
