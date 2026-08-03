package com.example.demo.controller;

import com.example.demo.domain.MovieRecord;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import jakarta.annotation.PostConstruct;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/movies")
public class MovieController {

    private final Map<Long, MovieRecord> repository = new HashMap<>();
    private final AtomicLong sequence = new AtomicLong(0);

    // □ 샘플 데이터 3개 등록 (앱 시작 시 자동 실행)
    @PostConstruct
    public void init() {
        saveSampleData(
            "스파이더맨: 브랜드 뉴 데이",
            "영희",
            "[장르] 슈퍼히어로, 액션, 모험, 드라마, 로맨스, SF, 스릴러, 범죄\n\n[감상평] 피터파커의 액션과 피터파커를 잊은 친구들의 서사를 알고 있으니까 너무 좀 슬프지만 액션으로 인해 환기 되는것같아!"
        );
        saveSampleData(
            "인터스텔라",
            "철수",
            "[장르] SF, 드라마, 모험\n\n[감상평] 우주와 시공간을 초월한 부성애가 정말 인상 깊었던 명작!"
        );
        saveSampleData(
            "다크 나이트",
            "민수",
            "[장르] 액션, 범죄, 스릴러\n\n[감상평] 조커의 연기와 하비 덴트의 변화가 압권인 최고의 히어로 영화."
        );
    }

    private void saveSampleData(String title, String writer, String content) {
        Long id = sequence.incrementAndGet();
        MovieRecord record = new MovieRecord(id, title, writer, content);
        repository.put(id, record);
    }

    // 1. 목록 조회 (선택형: 최신순 정렬 & 제목 검색)
    @GetMapping
    public String list(@RequestParam(value = "keyword", required = false) String keyword, Model model) {
        List<MovieRecord> list = new ArrayList<>(repository.values());

        // 검색 기능 (제목 기준)
        if (keyword != null && !keyword.trim().isEmpty()) {
            list = list.stream()
                    .filter(m -> m.getTitle().toLowerCase().contains(keyword.toLowerCase()))
                    .collect(Collectors.toList());
        }

        // 최신순 정렬 (ID 내림차순)
        list.sort((a, b) -> Long.compare(b.getId(), a.getId()));

        model.addAttribute("movies", list);
        model.addAttribute("keyword", keyword);
        return "movies/list";
    }

    // 2. 등록 폼
    @GetMapping("/add")
    public String addForm(Model model) {
        model.addAttribute("movie", new MovieRecord());
        return "movies/addForm";
    }

    // 3. 등록 처리
    @PostMapping("/add")
    public String add(@ModelAttribute MovieRecord movie) {
        Long id = sequence.incrementAndGet();
        movie.setId(id);
        movie.setViewCount(0);
        repository.put(id, movie);
        return "redirect:/movies";
    }

    // 4. 상세 조회 (도전형: 조회수 증가 기능)
    @GetMapping("/{id}")
    public String detail(@PathVariable("id") Long id, Model model) {
        MovieRecord movie = repository.get(id);
        if (movie != null) {
            movie.setViewCount(movie.getViewCount() + 1); // 조회수 증가
        }
        model.addAttribute("movie", movie);
        return "movies/detail";
    }

    // 5. 수정 폼
    @GetMapping("/{id}/edit")
    public String editForm(@PathVariable("id") Long id, Model model) {
        MovieRecord movie = repository.get(id);
        model.addAttribute("movie", movie);
        return "movies/editForm";
    }

    // 6. 수정 처리
    @PostMapping("/{id}/edit")
    public String edit(@PathVariable("id") Long id, @ModelAttribute MovieRecord updateParam) {
        MovieRecord movie = repository.get(id);
        if (movie != null) {
            movie.setTitle(updateParam.getTitle());
            movie.setWriter(updateParam.getWriter());
            movie.setContent(updateParam.getContent());
        }
        return "redirect:/movies/" + id;
    }

    // 7. 삭제 처리
    @PostMapping("/{id}/delete")
    public String delete(@PathVariable("id") Long id) {
        repository.remove(id);
        return "redirect:/movies";
    }
}