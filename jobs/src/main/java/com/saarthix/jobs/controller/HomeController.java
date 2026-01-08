package com.saarthix.jobs.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HomeController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> home() {
        return ResponseEntity.ok(Map.of(
                "message", "Saarthix Jobs API",
                "status", "running",
                "version", "1.0.0",
                "endpoints", Map.of(
                        "api", "/api",
                        "jobs", "/api/jobs",
                        "auth", "/api/auth",
                        "health", "/api/test"
                ),
                "frontend", "The frontend is a separate React application. " +
                        "Run 'npm run dev' in the frontend folder to start it on http://localhost:2003",
                "documentation", "This is a REST API backend. Use the frontend application to interact with the UI."
        ));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP"));
    }
}


