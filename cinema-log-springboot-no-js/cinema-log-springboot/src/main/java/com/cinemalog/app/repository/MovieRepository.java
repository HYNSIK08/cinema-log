package com.cinemalog.app.repository;

import com.cinemalog.app.entity.Movie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface MovieRepository extends JpaRepository<Movie, Long> {
    @Query("""
        select m from Movie m
        where (:isAdmin = true or m.hidden = false)
          and (:search = '' or lower(m.title) like lower(concat('%', :search, '%')))
          and (:genre = '' or m.genre = :genre)
        order by m.id desc
        """)
    List<Movie> search(@Param("search") String search,
                       @Param("genre") String genre,
                       @Param("isAdmin") boolean isAdmin);
}
