package com.cinemalog.app.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.Map;

@Service
public class TmdbService {
    private final RestClient client;
    private final String apiKey;

    public TmdbService(RestClient.Builder builder,
                       @Value("${tmdb.base-url}") String baseUrl,
                       @Value("${tmdb.api-key:}") String apiKey) {
        this.client = builder.baseUrl(baseUrl).build();
        this.apiKey = apiKey;
    }

    public Map<?, ?> popular() {
        return get("/movie/popular?api_key={key}&language=ko-KR&page=1", apiKey);
    }

    public Map<?, ?> search(String query) {
        return get("/search/movie?api_key={key}&language=ko-KR&query={query}&page=1", apiKey, query);
    }

    public Map<?, ?> detail(Long id) {
        return get("/movie/{id}?api_key={key}&language=ko-KR", id, apiKey);
    }

    private Map<?, ?> get(String uri, Object... variables) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "TMDB_API_KEY 환경 변수가 설정되지 않았습니다.");
        }
        return client.get().uri(uri, variables).retrieve()
                .onStatus(HttpStatusCode::isError, (request, response) -> {
                    throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                            "TMDB API 호출에 실패했습니다: " + response.getStatusCode());
                })
                .body(Map.class);
    }
}
