using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using LIK.Api.Models;
using Microsoft.IdentityModel.Tokens;

namespace LIK.Api.Services;

/// <summary>Creates the JWT that the frontend sends in the Authorization header.</summary>
public class TokenService
{
    private readonly IConfiguration _config;

    public TokenService(IConfiguration config)
    {
        _config = config;
    }

    public string Create(AppUser user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // Short claim names ("sub", "role") are used on purpose. Program.cs turns off claim-name mapping.
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("name", user.Name),
            new Claim("role", user.Role)
        };

        var hours = _config.GetValue<int?>("Jwt:ExpiryHours") ?? 8;

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(hours),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
