package com.cinemalog.app.controller;

import com.cinemalog.app.dto.MovieForm;
import com.cinemalog.app.entity.Movie;
import com.cinemalog.app.service.MovieService;
import com.cinemalog.app.service.TmdbService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.*;

@Controller
public class WebController {
    private final MovieService movieService;
    private final TmdbService tmdbService;
    private final String adminId;
    private final String adminPassword;

    public WebController(MovieService movieService,
                         TmdbService tmdbService,
                         @Value("${app.admin.id}") String adminId,
                         @Value("${app.admin.password}") String adminPassword) {
        this.movieService = movieService;
        this.tmdbService = tmdbService;
        this.adminId = adminId;
        this.adminPassword = adminPassword;
    }

    @GetMapping({"/", "/movies"})
    public String index(@RequestParam(defaultValue = "") String search,
                        @RequestParam(defaultValue = "") String genre,
                        @RequestParam(defaultValue = "") String tmdbQuery,
                        HttpSession session, Model model) {
        boolean admin = isAdmin(session);
        model.addAttribute("movies", movieService.findAll(search, genre, admin));
        model.addAttribute("search", search);
        model.addAttribute("genre", genre);
        model.addAttribute("admin", admin);
        model.addAttribute("favoriteIds", favorites(session));
        try {
            Map<?, ?> data = tmdbQuery.isBlank() ? tmdbService.popular() : tmdbService.search(tmdbQuery);
            Object results = data == null ? List.of() : data.get("results");
            model.addAttribute("tmdbMovies", results instanceof List<?> list ? list : List.of());
        } catch (RuntimeException e) {
            model.addAttribute("tmdbMovies", List.of());
            model.addAttribute("tmdbError", e.getMessage());
        }
        model.addAttribute("tmdbQuery", tmdbQuery);
        return "index";
    }

    @GetMapping("/movies/{id}")
    public String detail(@PathVariable Long id, HttpSession session, Model model) {
        Movie movie = movieService.findAndIncreaseViews(id);
        boolean admin = isAdmin(session);
        if (movie.isHidden() && !admin) return "redirect:/";
        List<Movie> related = movieService.findAll("", "", admin).stream()
                .filter(m -> !Objects.equals(m.getId(), id))
                .filter(m -> Objects.equals(m.getTitle(), movie.getTitle()) ||
                        (movie.getGenre() != null && Objects.equals(m.getGenre(), movie.getGenre())))
                .limit(5).toList();
        model.addAttribute("movie", movie);
        model.addAttribute("related", related);
        model.addAttribute("admin", admin);
        model.addAttribute("favorite", favorites(session).contains(id));
        return "detail";
    }

    @GetMapping("/movies/new")
    public String createForm(@RequestParam(defaultValue = "") String title,
                             @RequestParam(defaultValue = "") String genre, Model model) {
        MovieForm form = new MovieForm();
        form.setTitle(title);
        form.setGenre(genre);
        model.addAttribute("movieForm", form);
        model.addAttribute("edit", false);
        return "movie-form";
    }

    @PostMapping("/movies")
    public String create(@Valid @ModelAttribute MovieForm movieForm, BindingResult result, Model model,
                         RedirectAttributes redirect) {
        if (result.hasErrors()) {
            model.addAttribute("edit", false);
            return "movie-form";
        }
        Movie saved = movieService.create(movieForm);
        redirect.addFlashAttribute("message", "감상평이 등록되었습니다.");
        return "redirect:/movies/" + saved.getId();
    }

    @GetMapping("/movies/{id}/edit")
    public String editForm(@PathVariable Long id, HttpSession session, Model model) {
        if (!isAdmin(session)) return "redirect:/admin/login";
        Movie movie = movieService.findOne(id);
        MovieForm form = new MovieForm();
        form.setTitle(movie.getTitle()); form.setGenre(movie.getGenre());
        form.setWriter(movie.getWriter()); form.setContent(movie.getContent());
        model.addAttribute("movieForm", form);
        model.addAttribute("movieId", id);
        model.addAttribute("edit", true);
        return "movie-form";
    }

    @PostMapping("/movies/{id}")
    public String update(@PathVariable Long id, @Valid @ModelAttribute MovieForm movieForm,
                         BindingResult result, HttpSession session, Model model,
                         RedirectAttributes redirect) {
        if (!isAdmin(session)) return "redirect:/admin/login";
        if (result.hasErrors()) {
            model.addAttribute("movieId", id); model.addAttribute("edit", true);
            return "movie-form";
        }
        movieService.update(id, movieForm);
        redirect.addFlashAttribute("message", "감상평이 수정되었습니다.");
        return "redirect:/movies/" + id;
    }

    @PostMapping("/movies/{id}/like")
    public String like(@PathVariable Long id) { movieService.like(id); return "redirect:/movies/" + id; }

    @PostMapping("/movies/{id}/hide")
    public String hide(@PathVariable Long id, HttpSession session) {
        if (!isAdmin(session)) return "redirect:/admin/login";
        Movie movie = movieService.findOne(id);
        movieService.toggleHidden(id);
        return "redirect:/movies/" + id;
    }

    @PostMapping("/movies/{id}/delete")
    public String delete(@PathVariable Long id, HttpSession session, RedirectAttributes redirect) {
        if (!isAdmin(session)) return "redirect:/admin/login";
        movieService.delete(id);
        redirect.addFlashAttribute("message", "삭제되었습니다.");
        return "redirect:/";
    }

    @PostMapping("/movies/delete-all")
    public String deleteAll(HttpSession session, RedirectAttributes redirect) {
        if (!isAdmin(session)) return "redirect:/admin/login";
        movieService.deleteAll();
        redirect.addFlashAttribute("message", "전체 감상평을 삭제했습니다.");
        return "redirect:/";
    }

    @GetMapping("/admin/login")
    public String loginForm(HttpSession session) { return isAdmin(session) ? "redirect:/" : "login"; }

    @PostMapping("/admin/login")
    public String login(@RequestParam String id, @RequestParam String password,
                        HttpSession session, Model model) {
        if (adminId.equals(id.trim()) && adminPassword.equals(password)) {
            session.setAttribute("ADMIN", true);
            return "redirect:/";
        }
        model.addAttribute("error", "관리자 아이디 또는 비밀번호가 올바르지 않습니다.");
        return "login";
    }

    @PostMapping("/admin/logout")
    public String logout(HttpSession session) { session.invalidate(); return "redirect:/"; }

    @PostMapping("/favorites/{id}")
    public String toggleFavorite(@PathVariable Long id, HttpSession session,
                                 @RequestParam(defaultValue = "/favorites") String returnTo) {
        Set<Long> ids = favorites(session);
        if (!ids.add(id)) ids.remove(id);
        session.setAttribute("FAVORITES", ids);
        return "redirect:" + safeReturn(returnTo);
    }

    @GetMapping("/favorites")
    public String favoritePage(HttpSession session, Model model) {
        Set<Long> ids = favorites(session);
        List<Movie> movies = ids.stream().map(id -> {
            try { return movieService.findOne(id); } catch (RuntimeException e) { return null; }
        }).filter(Objects::nonNull).toList();
        model.addAttribute("movies", movies);
        model.addAttribute("admin", isAdmin(session));
        return "favorites";
    }

    @GetMapping("/about") public String about(HttpSession session, Model model) {
        model.addAttribute("admin", isAdmin(session)); return "about";
    }

    private boolean isAdmin(HttpSession session) { return Boolean.TRUE.equals(session.getAttribute("ADMIN")); }

    @SuppressWarnings("unchecked")
    private Set<Long> favorites(HttpSession session) {
        Object value = session.getAttribute("FAVORITES");
        if (value instanceof Set<?>) return (Set<Long>) value;
        Set<Long> ids = new LinkedHashSet<>(); session.setAttribute("FAVORITES", ids); return ids;
    }

    private String safeReturn(String value) {
        return value != null && value.startsWith("/") && !value.startsWith("//") ? value : "/favorites";
    }
}
