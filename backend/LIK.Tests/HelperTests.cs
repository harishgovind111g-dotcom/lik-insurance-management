using LIK.Api.Dtos;
using LIK.Api.Services;
using Xunit;

namespace LIK.Tests;

public class HelperTests
{
    [Fact]
    public void Lines_SplitsTextAndRemovesEmptyLines()
    {
        var lines = Mapper.Lines("Hospital cover\n\n  Day care  \n");

        Assert.Equal(new[] { "Hospital cover", "Day care" }, lines);
    }

    [Fact]
    public void Lines_EmptyText_ReturnsEmptyArray()
    {
        Assert.Empty(Mapper.Lines(""));
    }

    [Theory]
    [InlineData("", false)]
    [InlineData("Enter your API key here", false)]
    [InlineData("AIzaSyExampleKey123", true)]
    public void Gemini_IsConfigured_OnlyWithRealKey(string key, bool expected)
    {
        var config = TestHelper.Config(new() { ["Gemini:ApiKey"] = key });
        var service = new GeminiService(new HttpClient(), config);

        Assert.Equal(expected, service.IsConfigured);
    }

    [Fact]
    public void Token_IsCreatedForUser()
    {
        var service = new TokenService(TestHelper.Config());
        var token = service.Create(new LIK.Api.Models.AppUser { Id = 1, Name = "Test", Email = "t@test.com", Role = "User" });

        Assert.Equal(3, token.Split('.').Length); // header.payload.signature
    }
}
