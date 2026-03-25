package com.spartanscholars.backend.config;

import com.spartanscholars.backend.auth.JwtFilter;
import lombok.RequiredArgsConstructor;
//import com.spartanscholars.backend.user.CustomUserDetailsService;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
//import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
//import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
//import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
//import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.multipart.MultipartResolver;
import org.springframework.web.multipart.support.StandardServletMultipartResolver;

//import java.util.List;
@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(Customizer.withDefaults())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                    .requestMatchers(
                        "/",
                        "/login",
                        "/signup",
                        "/ai-assistant",
                        "/study-groups",
                        "/take-quizzes",
                        "/explore-topics",
                        "/discussion-board",
                        "/discussion-board/new",
                        "/analytics",
                        "/notes",
                        "/notes/view/**",
                        "/note-detail.html",
                        "/index.html",
                        "/signup.html",
                        "/login.html",
                        "/style.css",
                        "/js/**",
                        "/assets/**",
                        "/favicon.ico",
                        "/api/auth/register", 
                        "/api/auth/login",
                        "/theme.js",
                        "/ai-assistant.html",
                        "/analytics.html",
                        "/discussion-board.html",
                        "/discussion-new.html",
                        "/discussionboard.html",
                        "/explore-topics.html",
                        "/explore.html",
                        "/notes-summaries.html",
                        "/Notes.html",
                        "/quizzess.html",
                        "/study-groups.html",
                        "/take-quizzes.html"
                    ).permitAll()
                    .requestMatchers("/api/auth/**", "/favicon.ico").permitAll()
                    .requestMatchers("/uploads/**").permitAll()
                    .requestMatchers("/api/notes/*/download").permitAll()
                    .requestMatchers("/api/notes/*/preview").permitAll()
                    .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .logout(logout -> logout.disable())
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable());

        http.headers(headers -> headers
            .frameOptions(frame -> frame.disable())
        );

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:5500",
                "http://127.0.0.1:5500"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public MultipartResolver multipartResolver(){
        return new StandardServletMultipartResolver();
    }
}
