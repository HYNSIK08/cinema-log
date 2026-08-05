package com.cinemalog.app.service;

import com.cinemalog.app.dto.MovieRequest;
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

    public List<Movie> findAll(String search, String genre, boolean isAdmin) {
        return movieRepository.search(normalize(search), normalize(genre), isAdmin);
    }

    @Transactional
    public Movie findAndIncreaseViews(Long id) {
        Movie movie = findById(id);
        movie.setViews(movie.getViews() + 1);
        return movie;
    }

    @Transactional
    public Movie create(MovieRequest request) {
        Movie movie = new Movie();
        apply(movie, request);
        return movieRepository.save(movie);
    }

    @Transactional
    public Movie create(MovieForm form) {
        Movie movie = new Movie();
        apply(movie, form);
        return movieRepository.save(movie);
    }

    @Transactional
    public Movie update(Long id, MovieRequest request) {
        Movie movie = findById(id);
        apply(movie, request);
        return movie;
    }

    @Transactional
    public Movie update(Long id, MovieForm form) {
        Movie movie = findById(id);
        apply(movie, form);
        return movie;
    }

    public Movie findOne(Long id) {
        return findById(id);
    }

    @Transactional
    public int like(Long id) {
        Movie movie = findById(id);
        movie.setLikes(movie.getLikes() + 1);
        return movie.getLikes();
    }

    @Transactional
    public void setHidden(Long id, boolean hidden) {
        findById(id).setHidden(hidden);
    }

    @Transactional
    public void delete(Long id) {
        if (!movieRepository.existsById(id)) throw new NotFoundException("게시글을 찾을 수 없습니다.");
        movieRepository.deleteById(id);
    }

    @Transactional
    public void deleteAll() {
        movieRepository.deleteAllInBatch();
    }

    private Movie findById(Long id) {
        return movieRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("게시글을 찾을 수 없습니다."));
    }

    private void apply(Movie movie, MovieRequest request) {
        movie.setTitle(request.title().trim());
        movie.setGenre(normalizeNullable(request.genre()));
        movie.setWriter(normalizeNullable(request.writer()));
        movie.setContent(normalizeNullable(request.content()));
    }

    private void apply(Movie movie, MovieForm form) {
        movie.setTitle(form.getTitle().trim());
        movie.setGenre(normalizeNullable(form.getGenre()));
        movie.setWriter(normalizeNullable(form.getWriter()));
        movie.setContent(normalizeNullable(form.getContent()));
    }

    private String normalize(String value) { return value == null ? "" : value.trim(); }
    private String normalizeNullable(String value) { return value == null ? null : value.trim(); }
}
