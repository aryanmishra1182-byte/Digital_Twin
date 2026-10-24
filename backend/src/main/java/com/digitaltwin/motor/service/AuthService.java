package com.digitaltwin.motor.service;

import com.digitaltwin.motor.domain.AppUser;
import com.digitaltwin.motor.dto.AuthResponse;
import com.digitaltwin.motor.dto.LoginRequest;
import com.digitaltwin.motor.dto.RegisterRequest;
import com.digitaltwin.motor.repository.AppUserRepository;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;

@Service
public class AuthService {

    private final AppUserRepository userRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(AppUserRepository userRepository) {
        this.userRepository = userRepository;
        // Seed default research/operator user if not present
        if (!userRepository.existsByEmail("operator@machina-x.industrial")) {
            register(new RegisterRequest() {{
                setEmail("operator@machina-x.industrial");
                setPassword("MachinaX2026!");
                setFullName("Lead Plant Reliability Engineer");
            }});
        }
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("User with email " + request.getEmail() + " already exists.");
        }
        String salt = generateSalt();
        String hash = hashPassword(request.getPassword(), salt);
        String storedValue = salt + ":" + hash;

        AppUser user = new AppUser(request.getEmail(), storedValue, request.getFullName(), "ROLE_ENGINEER");
        userRepository.save(user);

        String token = generateToken(user.getEmail(), user.getRole());
        return new AuthResponse(token, user.getEmail(), user.getFullName(), user.getRole(), false);
    }

    public AuthResponse login(LoginRequest request) {
        Optional<AppUser> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Invalid email or password.");
        }
        AppUser user = userOpt.get();
        String[] parts = user.getPasswordHash().split(":");
        if (parts.length != 2) {
            throw new IllegalStateException("Corrupt password record.");
        }
        String salt = parts[0];
        String expectedHash = parts[1];
        String actualHash = hashPassword(request.getPassword(), salt);

        if (!expectedHash.equals(actualHash)) {
            throw new IllegalArgumentException("Invalid email or password.");
        }

        String token = generateToken(user.getEmail(), user.getRole());
        return new AuthResponse(token, user.getEmail(), user.getFullName(), user.getRole(), false);
    }

    public AuthResponse createGuestSession() {
        String token = generateToken("guest@machina-x.demo", "ROLE_GUEST");
        return new AuthResponse(token, "guest@machina-x.demo", "Guest Academic Reviewer", "ROLE_GUEST", true);
    }

    private String generateSalt() {
        byte[] salt = new byte[16];
        secureRandom.nextBytes(salt);
        return Base64.getEncoder().encodeToString(salt);
    }

    private String hashPassword(String password, String salt) {
        try {
            PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt.getBytes(StandardCharsets.UTF_8), 65536, 256);
            SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            byte[] hash = factory.generateSecret(spec).getEncoded();
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException | InvalidKeySpecException e) {
            throw new RuntimeException("Error hashing password", e);
        }
    }

    private String generateToken(String email, String role) {
        long expiryEpoch = Instant.now().plusSeconds(86400 * 7).toEpochMilli();
        String payload = email + ":" + role + ":" + expiryEpoch;
        return Base64.getUrlEncoder().withoutPadding().encodeToString(payload.getBytes(StandardCharsets.UTF_8));
    }
}
