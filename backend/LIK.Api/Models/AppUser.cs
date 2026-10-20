namespace LIK.Api.Models;

public static class Roles
{
    public const string Admin = "Admin";
    public const string User = "User";
}

/// <summary>Entity: User (UserId, Name, Email, Phone, PasswordHash, Role).</summary>
public class AppUser
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Phone { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string Role { get; set; } = Roles.User;
    public DateOnly CreatedOn { get; set; }

    public List<Policy> Policies { get; set; } = new();
}
