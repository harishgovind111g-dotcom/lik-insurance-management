using LIK.Api.Controllers;
using LIK.Api.Dtos;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace LIK.Tests;

public class PolicyTests
{
    [Fact]
    public async Task Apply_ForActivePlan_CreatesPolicy()
    {
        var db = TestHelper.NewDb();
        var (user, plan, oldPolicy) = TestHelper.Seed(db);
        db.Policies.Remove(oldPolicy);
        db.SaveChanges();

        var controller = new PoliciesController(db);
        TestHelper.SignIn(controller, user.Id);

        var result = await controller.Apply(new ApplyRequest(plan.Id));

        var ok = Assert.IsType<OkObjectResult>(result);
        var policy = Assert.IsType<PolicyDto>(ok.Value);
        Assert.StartsWith("LIK-", policy.Number);
        Assert.Equal(TestHelper.Today, policy.Start);
        Assert.Equal(TestHelper.Today.AddDays(plan.DurationDays - 1), policy.End);
    }

    [Fact]
    public async Task Apply_ForPlanAlreadyHeld_ReturnsBadRequest()
    {
        var db = TestHelper.NewDb();
        var (user, plan, _) = TestHelper.Seed(db);
        var controller = new PoliciesController(db);
        TestHelper.SignIn(controller, user.Id);

        var result = await controller.Apply(new ApplyRequest(plan.Id));

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Apply_ForHiddenPlan_ReturnsBadRequest()
    {
        var db = TestHelper.NewDb();
        var (user, plan, oldPolicy) = TestHelper.Seed(db);
        db.Policies.Remove(oldPolicy);
        plan.IsActive = false;
        db.SaveChanges();

        var controller = new PoliciesController(db);
        TestHelper.SignIn(controller, user.Id);

        var result = await controller.Apply(new ApplyRequest(plan.Id));

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Mine_ReturnsOnlyMyPolicies()
    {
        var db = TestHelper.NewDb();
        var (user, _, _) = TestHelper.Seed(db);
        var controller = new PoliciesController(db);
        TestHelper.SignIn(controller, user.Id + 99); // a different user

        var result = await controller.Mine();

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Empty(Assert.IsAssignableFrom<IEnumerable<PolicyDto>>(ok.Value));
    }
}
