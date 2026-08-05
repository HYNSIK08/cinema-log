package com.cinemalog.app.service;

import com.cinemalog.app.dto.MovieForm;
import com.cinemalog.app.entity.Movie;
import com.cinemalog.app.exception.NotFoundException;
import com.cinemalog.app.repository.MovieRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class MovieService {
    private final MovieRepository movieRepository;

    public MovieService(MovieRepository movieRepository) {
        this.movieRepository = movieRepository;
    }

    public List<Movie> findAll(String search, String genre, boolean admin) {
        return movieRepository.search(normalize(search), normalize(genre), admin);
    }

    public Movie findOne(Long id) {
        return movieRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("감상평을 찾을 수 없습니다."));
    }

    @Transactional
    public Movie findAndIncreaseViews(Long id) {
        Movie movie = findOne(id);
        movie.setViews(movie.getViews() + 1);
        return movie;
    }

    @Transactional
    public Movie create(MovieForm form) {
        Movie movie = new Movie();
        apply(movie, form);
        return movieRepository.save(movie);
    }

    @Transactional
    public Movie update(Long id, MovieForm form) {
        Movie movie = findOne(id);
        apply(movie, form);
        return movie;
    }

    @Transactional
    public void like(Long id) {
        Movie movie = findOne(id);
        movie.setLikes(movie.getLikes() + 1);
    }

    @Transactional
    public void toggleHidden(Long id) {
        Movie movie = findOne(id);
        movie.setHidden(!movie.isHidden());
    }

    @Transactional
    public void delete(Long id) {
        Movie movie = findOne(id);
        movieRepository.delete(movie);
    }

    @Transactional
    public void deleteAll() {
        movieRepository.deleteAllInBatch();
    }

    private void apply(Movie movie, MovieForm form) {
        movie.setTitle(form.getTitle().trim());
        movie.setGenre(normalizeNullable(form.getGenre()));
        movie.setWriter(normalizeNullable(form.getWriter()));
        movie.setContent(normalizeNullable(form.getContent()));
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    private String normalizeNullable(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }
}
