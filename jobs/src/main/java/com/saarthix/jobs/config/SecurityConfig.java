package com.saarthix.jobs.config;

import com.saarthix.jobs.model.User;
import com.saarthix.jobs.repository.UserRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    private final UserRepository userRepository;

    public SecurityConfig(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // ✅ Enable CORS for frontend
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())

                // ✅ Authorization rules
                .authorizeHttpRequests(auth -> auth
        // ✅ Allow GET & POST job APIs without Google login
        .requestMatchers(HttpMethod.GET, "/api/jobs/**").permitAll()
        .requestMatchers(HttpMethod.POST, "/api/jobs/**").permitAll()
        
        // Public endpoints
        .requestMatchers(
                "/api/auth/**",
                "/api/test",
                "/",
                "/index.html",
                "/static/**",
                "/error",
                "/oauth2/**"
        ).permitAll()

        // Everything else requires Google OAuth
        .anyRequest().authenticated()
)


                // ✅ OAuth2 Login config
                .oauth2Login(oauth -> oauth
                        // IMPORTANT: Do not override Google's login page
                        .defaultSuccessUrl("http://localhost:5173", true)
                        .successHandler(successHandler())
                )

                // ✅ Logout config
                .logout(logout -> logout
                        .logoutSuccessUrl("http://localhost:5173")
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID")
                );

        return http.build();
    }

    // ✅ Success handler — saves user and redirects
    @Bean
    public AuthenticationSuccessHandler successHandler() {
        return (request, response, authentication) -> {
            OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();

            String email = oauthUser.getAttribute("email");
            String name = oauthUser.getAttribute("name");
            String picture = oauthUser.getAttribute("picture");

            userRepository.findByEmail(email)
                    .orElseGet(() -> userRepository.save(new User(name, email, picture)));

            response.sendRedirect("http://localhost:5173/"); // ✅ redirect to your React app
        };
    }

    // ✅ Proper CORS config
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
configuration.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:5174"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
