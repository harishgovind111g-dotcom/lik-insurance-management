using System.Security.Claims;
using LIK.Api.Data;
using LIK.Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace LIK.Tests;

/// <summary>Common setup used by all tests: an in-memory database and a fake logged-in user.</summary>
public static class TestHelper
{
    public static DateOnly Today => DateOnly.FromDateTime(DateTime.Now);

    /// <summary>New empty database for every test, so tests do not affect each other.</summary>
    public static AppDbContext NewDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    public static IConfiguration Config(Dictionary<string, string?>? extra = null)
    {
        var values = new Dictionary<string, string?>
        {
            ["Jwt:Key"] = "test-secret-key-for-unit-tests-0123456789",
            ["Jwt:Issuer"] = "LIK.Api",
            ["Jwt:Audience"] = "LIK.Frontend",
            ["Jwt:ExpiryHours"] = "1"
        };
        if (extra != null) foreach (var kv in extra) values[kv.Key] = kv.Value;
        return new ConfigurationBuilder().AddInMemoryCollection(values).Build();
    }

    /// <summary>Makes the controller behave as if this user sent the request with a valid JWT.</summary>
    public static void SignIn(ControllerBase controller, int userId, string role = Roles.User)
    {
        var identity = new ClaimsIdentity(
            new[] { new Claim("sub", userId.ToString()), new Claim("role", role) },
            "Test", "name", "role");
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
    }

    /// <summary>Adds one category, one plan, one customer and one active policy.</summary>
    public static (AppUser user, InsurancePlan plan, Policy policy) Seed(AppDbContext db)
    {
        var category = new InsuranceCategory { Slug = "health", Name = "Health Insurance", Description = "Health cover" };
        db.Categories.Add(category);
        db.SaveChanges();

        var plan = new InsurancePlan
        {
            CategoryId = category.Id, Provider = "Test Insurer", Name = "Basic Health",
            Premium = 5000, CoverAmount = 100000, DurationDays = 365, IsActive = true,
            Benefits = "Hospital cover\nDay care", Exclusions = "Cosmetic treatment"
        };
        db.Plans.Add(plan);

        var user = new AppUser
        {
            Name = "Test Customer", Email = "customer@test.com", Phone = "9876543210", Role = Roles.User,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test@1234"), CreatedOn = Today
        };
        db.Users.Add(user);
        db.SaveChanges();

        var policy = new Policy
        {
            PolicyNumber = "LIK-TEST-00001", UserId = user.Id, PlanId = plan.Id,
            StartDate = Today.AddDays(-30), EndDate = Today.AddDays(300)
        };
        db.Policies.Add(policy);
        db.SaveChanges();

        return (user, plan, policy);
    }
}
