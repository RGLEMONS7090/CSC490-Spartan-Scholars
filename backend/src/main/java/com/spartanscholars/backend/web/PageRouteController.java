package com.spartanscholars.backend.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Controller
public class PageRouteController {

    @GetMapping("/login")
    public String login() {
        return "forward:/login.html";
    }

    @GetMapping("/signup")
    public String signup() {
        return "forward:/signup.html";
    }

    @GetMapping("/ai-assistant")
    public String assistant() {
        return "forward:/ai-assistant.html";
    }

    @GetMapping("/study-groups")
    public String studyGroups() {
        return "forward:/study-groups.html";
    }

    @GetMapping("/take-quizzes")
    public String takeQuizzes() {
        return "forward:/take-quizzes.html";
    }

    @GetMapping("/explore-topics")
    public String exploreTopics() {
        return "forward:/explore-topics.html";
    }

    @GetMapping("/discussion-board")
    public String discussionBoard() {
        return "forward:/discussion-board.html";
    }

    @GetMapping("/analytics")
    public String analytics() {
        return "forward:/analytics.html";
    }

    @GetMapping("/notes")
    public String notes() {
        return "forward:/notes-summaries.html";
    }

    @GetMapping("/notes/view/{id}")
    public String noteDetails(@PathVariable Long id) {
        return "forward:/note-detail.html";
    }
}
