using LIK.Api.Controllers;
using LIK.Api.Dtos;
using LIK.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace LIK.Tests;

public class AuthTests
{
    private static AuthController NewController(out LIK.Api.Data.AppDbContext db)
    {
        db = TestHelper.NewDb();
        return new AuthController(db, new TokenService(TestHelper.Config()));
    }

    [Fact]
    public async Task Register_WithValidData_ReturnsToken()
    {
        var controller = NewController(out var db);

        var result = await controller.Register(new RegisterRequest("Ravi Kumar", "ravi@test.com", "9123456789", "Password1"));

        var ok = Assert.IsType<OkObjectResult>(result);
        var body = Assert.IsType<AuthResponse>(ok.Value);
        Assert.False(string.IsNullOrEmpty(body.Token));
        Assert.Equal("user", body.User.Role);
        Assert.Single(db.Users);
    }

    [Fact]
    public async Task Register_SavesPasswordAsHash_NotPlainText()
    {
        var controller = NewController(out var db);

        await controller.Register(new RegisterRequest("Ravi Kumar", "ravi@test.com", "9123456789", "Password1"));

        var saved = db.Users.Single();
        Assert.NotEqual("Password1", saved.PasswordHash);
        Assert.True(BCrypt.Net.BCrypt.Verify("Password1", saved.PasswordHash));
    }

    [Theory]
    [InlineData("short1")]       // less than 8 characters
    [InlineData("onlyletters")]  // no number
    [InlineData("12345678")]     // no letter
    public async Task Register_WithWeakPassword_ReturnsBadRequest(string password)
    {
        var controller = NewController(out _);

        var result = await controller.Register(new RegisterRequest("Ravi Kumar", "ravi@test.com", "9123456789", password));

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Theory]
    [InlineData("12345")]        // too short
    [InlineData("1234567890")]   // does not start with 6-9
    public async Task Register_WithInvalidPhone_ReturnsBadRequest(string phone)
    {
        var controller = NewController(out _);

        var result = await controller.Register(new RegisterRequest("Ravi Kumar", "ravi@test.com", phone, "Password1"));

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Register_WithExistingEmail_ReturnsConflict()
    {
        var controller = NewController(out _);
        await controller.Register(new RegisterRequest("Ravi Kumar", "ravi@test.com", "9123456789", "Password1"));

        var result = await controller.Register(new RegisterRequest("Another", "RAVI@test.com", "9123456780", "Password2"));

        Assert.IsType<ConflictObjectResult>(result);
    }

    [Fact]
    public async Task Login_WithCorrectPassword_ReturnsOk()
    {
        var controller = NewController(out var db);
        TestHelper.Seed(db);

        var result = await controller.Login(new LoginRequest("customer@test.com", "Test@1234"));

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Login_WithWrongPassword_ReturnsUnauthorized()
    {
        var controller = NewController(out var db);
        TestHelper.Seed(db);

        var result = await controller.Login(new LoginRequest("customer@test.com", "WrongPass1"));

        Assert.IsType<UnauthorizedObjectResult>(result);
    }
}
