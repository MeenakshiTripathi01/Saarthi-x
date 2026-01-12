package com.saarthix.jobs.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Order(1)
public class RequestLoggingFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String path = request.getRequestURI();
        String authHeader = request.getHeader("Authorization");
        
        if (path.contains("/api/")) {
            System.out.println("=========================================");
            System.out.println("REQUEST: " + request.getMethod() + " " + path);
            System.out.println("Authorization header: " + (authHeader != null ? 
                (authHeader.length() > 50 ? authHeader.substring(0, 50) + "..." : authHeader) : "MISSING"));
            System.out.println("=========================================");
        }
        
        filterChain.doFilter(request, response);
    }
}

