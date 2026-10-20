using LIK.Api.Controllers;
using LIK.Api.Dtos;
using LIK.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace LIK.Tests;

public class AdminTests
{
    private static (AdminController admin, InsuranceClaim claim, InsurancePlan plan) Setup()
    {
        var db = TestHelper.NewDb();
        var (user, plan, policy) = TestHelper.Seed(db);
        var claim = new InsuranceClaim
        {
            ClaimNumber = "CLM-1001", PolicyId = policy.Id, UserId = user.Id,
            IncidentDate = TestHelper.Today.AddDays(-3), Amount = 5000, Description = "Test claim description here",
            Status = ClaimStatus.Submitted, CreatedOn = TestHelper.Today
        };
        claim.Events.Add(new ClaimEvent { Status = ClaimStatus.Submitted, OccurredOn = TestHelper.Today });
        db.Claims.Add(claim);
        db.SaveChanges();

        var admin = new AdminController(db);
        TestHelper.SignIn(admin, 1000, Roles.Admin);
        return (admin, claim, plan);
    }

    [Fact]
    public async Task Approve_Claim_ChangesStatusAndAddsHistory()
    {
        var (admin, claim, _) = Setup();

        var result = await admin.UpdateClaimStatus(claim.Id, new UpdateClaimStatusRequest(ClaimStatus.Approved, "Documents verified"));

        var dto = Assert.IsType<ClaimDto>(Assert.IsType<OkObjectResult>(result).Value);
        Assert.Equal(ClaimStatus.Approved, dto.Status);
        Assert.Equal("Documents verified", dto.Remarks);
        Assert.Equal(2, dto.Events.Count);
    }

    [Fact]
    public async Task Reject_WithoutRemark_ReturnsBadRequest()
    {
        var (admin, claim, _) = Setup();

        var result = await admin.UpdateClaimStatus(claim.Id, new UpdateClaimStatusRequest(ClaimStatus.Rejected, ""));

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task UpdateStatus_WithInvalidStatus_ReturnsBadRequest()
    {
        var (admin, claim, _) = Setup();

        var result = await admin.UpdateClaimStatus(claim.Id, new UpdateClaimStatusRequest("Paid", "done"));

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task EditPlan_UpdatesPremiumAndBenefits()
    {
        var (admin, _, plan) = Setup();

        var result = await admin.UpdatePlan(plan.Id, new UpdatePlanRequest(
            "Test Insurer", "Basic Health Plus", 6500, 200000, 365,
            new[] { "Hospital cover", "Ambulance" }, new[] { "Cosmetic treatment" }, true));

        var dto = Assert.IsType<PlanDto>(Assert.IsType<OkObjectResult>(result).Value);
        Assert.Equal(6500, dto.Premium);
        Assert.Equal("Basic Health Plus", dto.Name);
        Assert.Equal(2, dto.Benefits.Length);
        Assert.True(dto.Popular);
    }

    [Fact]
    public async Task EditPlan_WithZeroPremium_ReturnsBadRequest()
    {
        var (admin, _, plan) = Setup();

        var result = await admin.UpdatePlan(plan.Id, new UpdatePlanRequest(
            "Test Insurer", "Basic Health", 0, 100000, 365, new[] { "Hospital cover" }, null, false));

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task TogglePlan_HidesThenShowsPlan()
    {
        var (admin, _, plan) = Setup();

        var hidden = Assert.IsType<PlanDto>(Assert.IsType<OkObjectResult>(await admin.TogglePlan(plan.Id)).Value);
        var shown = Assert.IsType<PlanDto>(Assert.IsType<OkObjectResult>(await admin.TogglePlan(plan.Id)).Value);

        Assert.False(hidden.Active);
        Assert.True(shown.Active);
    }
}
