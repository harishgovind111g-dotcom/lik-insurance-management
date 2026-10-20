using System.Text.RegularExpressions;
using LIK.Api.Data;
using LIK.Api.Dtos;
using LIK.Api.Models;
using LIK.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LIK.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ApiBase
{
    private readonly AppDbContext _db;
    private readonly TokenService _tokens;

    public AuthController(AppDbContext db, TokenService tokens)
    {
        _db = db;
        _tokens = tokens;
    }

    /// <summary>POST /api/auth/register: create a customer account and log in.</summary>
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest req)
    {
        var name = req.Name.Trim();
        var email = req.Email.Trim().ToLowerInvariant();
        var phone = req.Phone.Trim();

        if (name.Length < 2) return Fail("Enter your full name.");
        if (!Regex.IsMatch(email, @"^\S+@\S+\.\S+$")) return Fail("Enter a valid email address.");
        if (!Regex.IsMatch(phone, @"^[6-9]\d{9}$")) return Fail("Enter a 10-digit mobile number starting with 6 to 9.");
        if (req.Password.Length < 8 || !req.Password.Any(char.IsLetter) || !req.Password.Any(char.IsDigit))
            return Fail("Use at least 8 characters with a letter and a number.");

        if (await _db.Users.AnyAsync(u => u.Email == email))
            return Conflict(new { message = "An account with this email already exists. Log in instead." });

        var user = new AppUser
        {
            Name = name,
            Email = email,
            Phone = phone,
            Role = Roles.User,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            CreatedOn = Today
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return Ok(new AuthResponse(_tokens.Create(user), user.ToDto()));
    }

    /// <summary>POST /api/auth/login: check the password and return a JWT.</summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest req)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

        if (user == null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Unauthorized(new { message = "The email or password is incorrect. Check them and try again." });

        return Ok(new AuthResponse(_tokens.Create(user), user.ToDto()));
    }

    /// <summary>GET /api/auth/me: the logged-in user (used to restore a session).</summary>
    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == CurrentUserId);
        if (user == null) return Unauthorized(new { message = "Your session has ended. Please log in again." });
        return Ok(user.ToDto());
    }

    /// <summary>PUT /api/auth/profile: change name and phone.</summary>
    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile(UpdateProfileRequest req)
    {
        var name = req.Name.Trim();
        var phone = req.Phone.Trim();

        if (name.Length < 2) return Fail("Enter your full name.");
        if (!Regex.IsMatch(phone, @"^[6-9]\d{9}$")) return Fail("Enter a 10-digit mobile number starting with 6 to 9.");

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == CurrentUserId);
        if (user == null) return Unauthorized(new { message = "Your session has ended. Please log in again." });

        user.Name = name;
        user.Phone = phone;
        await _db.SaveChangesAsync();

        return Ok(user.ToDto());
    }
}
