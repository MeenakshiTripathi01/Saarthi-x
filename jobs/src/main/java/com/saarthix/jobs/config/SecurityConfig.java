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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.List;

@Configuration
public class SecurityConfig {

    private final UserRepository userRepository;

    public SecurityConfig(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
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
                        .requestMatchers("/api/hackathons/**").permitAll()
                        .requestMatchers("/api/hackathons/apply/**").permitAll()

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
                                "/oauth2/**")
                        .permitAll()

                        // ✅ Get current user endpoint (requires auth)
                        .requestMatchers(HttpMethod.GET, "/api/user/me").authenticated()

                        // ✅ Save role endpoint (public, called after OAuth)
                        .requestMatchers(HttpMethod.POST, "/api/user/save-role").permitAll()

                        // Everything else requires Google OAuth
                        .anyRequest().authenticated())

                // ✅ OAuth2 Login config
                .oauth2Login(oauth -> oauth
                        // IMPORTANT: Do not override Google's login page
                        .defaultSuccessUrl("http://localhost:5173", true)
                        .successHandler(successHandler()))

                // ✅ Logout config
                .logout(logout -> logout
                        .logoutSuccessUrl("http://localhost:5173")
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID"));

        return http.build();
    }

    // ✅ Success handler — handles both new and existing users
    @Bean
    public AuthenticationSuccessHandler successHandler() {
        return (request, response, authentication) -> {
            try {
                System.out.println("🔐 [OAuth Success Handler] Triggered");
                System.out.println("🔐 [OAuth Success Handler] Authentication principal type: " + authentication.getPrincipal().getClass().getName());
                
                OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();
                System.out.println("🔐 [OAuth Success Handler] OAuth2User attributes: " + oauthUser.getAttributes().keySet());

                String email = oauthUser.getAttribute("email");
                String name = oauthUser.getAttribute("name");
                String picture = oauthUser.getAttribute("picture");

                System.out.println("🔐 [OAuth Success Handler] Email: " + email);
                System.out.println("🔐 [OAuth Success Handler] Name: " + name);

                if (email == null || email.isEmpty()) {
                    System.err.println("❌ [OAuth Success Handler] Email is null or empty!");
                    response.sendError(400, "Email not provided by OAuth provider");
                    return;
                }

                User existingUser = userRepository.findByEmail(email).orElse(null);
                System.out.println("🔐 [OAuth Success Handler] User found in DB: " + (existingUser != null));

                if (existingUser == null) {
                    // NEW USER - redirect to role selection
                    System.out.println("🔐 [OAuth Success Handler] New user - redirecting to choose-role");
                    String intent = request.getParameter("intent");
                    String intentParam = (intent != null && !intent.isEmpty()) ? "&intent=" + intent : "";

                    String redirectUrl = String.format(
                            "http://localhost:5173/choose-role?email=%s&name=%s&picture=%s%s",
                            java.net.URLEncoder.encode(email, "UTF-8"),
                            java.net.URLEncoder.encode(name != null ? name : "", "UTF-8"),
                            java.net.URLEncoder.encode(picture != null ? picture : "", "UTF-8"),
                            intentParam);
                    System.out.println("🔐 [OAuth Success Handler] Redirect URL: " + redirectUrl);
                    response.sendRedirect(redirectUrl);
                } else {
                    // EXISTING USER - has role saved in database
                    System.out.println("🔐 [OAuth Success Handler] Existing user - redirecting to home");
                    System.out.println("🔐 [OAuth Success Handler] User ID: " + existingUser.getId());
                    System.out.println("🔐 [OAuth Success Handler] User Type: " + existingUser.getUserType());
                    response.sendRedirect("http://localhost:5173/");
                }
            } catch (Exception e) {
                System.err.println("❌ [OAuth Success Handler] EXCEPTION: " + e.getMessage());
                e.printStackTrace();
                try {
                    response.sendError(500, "OAuth handler error: " + e.getMessage());
                } catch (Exception ignored) {
                }
            }
        };
    }

    // ✅ Proper CORS config
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:5174"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
