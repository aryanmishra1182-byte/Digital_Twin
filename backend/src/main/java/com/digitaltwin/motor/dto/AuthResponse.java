package com.digitaltwin.motor.dto;

public class AuthResponse {
    private String token;
    private String email;
    private String fullName;
    private String role;
    private boolean isGuest;

    public AuthResponse() {}

    public AuthResponse(String token, String email, String fullName, String role, boolean isGuest) {
        this.token = token;
        this.email = email;
        this.fullName = fullName;
        this.role = role;
        this.isGuest = isGuest;
    }

    public String getToken() { return token; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public String getRole() { return role; }
    public boolean isGuest() { return isGuest; }
}
