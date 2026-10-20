using LIK.Api.Controllers;
using LIK.Api.Dtos;
using LIK.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace LIK.Tests;

public class ClaimTests
{
    private static ClaimsController NewController(LIK.Api.Data.AppDbContext db, int userId)
    {
        // The file upload parts are not used in these tests, so no web host environment is needed.
        var controller = new ClaimsController(db, null!, TestHelper.Config());
        TestHelper.SignIn(controller, userId);
        return controller;
    }

    private const string GoodDescription = "Admitted to hospital for two days due to fever.";

    [Fact]
    public async Task Create_ValidClaim_IsSavedWithStatusSubmitted()
    {
        var db = TestHelper.NewDb();
        var (user, _, policy) = TestHelper.Seed(db);
        var controller = NewController(db, user.Id);

        var result = await controller.Create(new CreateClaimRequest(policy.Id, TestHelper.Today.AddDays(-2), 25000, GoodDescription, null));

        var ok = Assert.IsType<OkObjectResult>(result);
        var claim = Assert.IsType<ClaimDto>(ok.Value);
        Assert.Equal(ClaimStatus.Submitted, claim.Status);
        Assert.StartsWith("CLM-", claim.No);
        Assert.Single(claim.Events);
    }

    [Fact]
    public async Task Create_AmountAboveCover_ReturnsBadRequest()
    {
        var db = TestHelper.NewDb();
        var (user, plan, policy) = TestHelper.Seed(db);
        var controller = NewController(db, user.Id);

        var result = await controller.Create(new CreateClaimRequest(policy.Id, TestHelper.Today.AddDays(-2), plan.CoverAmount + 1, GoodDescription, null));

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Create_FutureIncidentDate_ReturnsBadRequest()
    {
        var db = TestHelper.NewDb();
        var (user, _, policy) = TestHelper.Seed(db);
        var controller = NewController(db, user.Id);

        var result = await controller.Create(new CreateClaimRequest(policy.Id, TestHelper.Today.AddDays(5), 1000, GoodDescription, null));

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Create_IncidentBeforePolicyStart_ReturnsBadRequest()
    {
        var db = TestHelper.NewDb();
        var (user, _, policy) = TestHelper.Seed(db);
        var controller = NewController(db, user.Id);

        var result = await controller.Create(new CreateClaimRequest(policy.Id, policy.StartDate.AddDays(-1), 1000, GoodDescription, null));

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Create_ShortDescription_ReturnsBadRequest()
    {
        var db = TestHelper.NewDb();
        var (user, _, policy) = TestHelper.Seed(db);
        var controller = NewController(db, user.Id);

        var result = await controller.Create(new CreateClaimRequest(policy.Id, TestHelper.Today.AddDays(-1), 1000, "too short", null));

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Create_OnSomeoneElsesPolicy_ReturnsBadRequest()
    {
        var db = TestHelper.NewDb();
        var (user, _, policy) = TestHelper.Seed(db);
        var controller = NewController(db, user.Id + 50); // not the owner

        var result = await controller.Create(new CreateClaimRequest(policy.Id, TestHelper.Today.AddDays(-1), 1000, GoodDescription, null));

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Create_OnExpiredPolicy_ReturnsBadRequest()
    {
        var db = TestHelper.NewDb();
        var (user, _, policy) = TestHelper.Seed(db);
        policy.StartDate = TestHelper.Today.AddDays(-400);
        policy.EndDate = TestHelper.Today.AddDays(-10);
        db.SaveChanges();
        var controller = NewController(db, user.Id);

        var result = await controller.Create(new CreateClaimRequest(policy.Id, TestHelper.Today.AddDays(-20), 1000, GoodDescription, null));

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Get_ClaimOfAnotherUser_ReturnsNotFound()
    {
        var db = TestHelper.NewDb();
        var (user, _, policy) = TestHelper.Seed(db);
        var owner = NewController(db, user.Id);
        var created = (ClaimDto)((OkObjectResult)await owner.Create(
            new CreateClaimRequest(policy.Id, TestHelper.Today.AddDays(-1), 1000, GoodDescription, null))).Value!;

        var stranger = NewController(db, user.Id + 7);
        var result = await stranger.Get(int.Parse(created.Id));

        Assert.IsType<NotFoundObjectResult>(result);
    }
}
