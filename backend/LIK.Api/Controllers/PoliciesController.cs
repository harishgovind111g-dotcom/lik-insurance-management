using LIK.Api.Data;
using LIK.Api.Dtos;
using LIK.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LIK.Api.Controllers;

/// <summary>A logged-in user's policies ("My Policies").</summary>
[ApiController]
[Authorize]
[Route("api/policies")]
public class PoliciesController : ApiBase
{
    private readonly AppDbContext _db;

    public PoliciesController(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>GET /api/policies: policies that belong to the logged-in user.</summary>
    [HttpGet]
    public async Task<IActionResult> Mine()
    {
        var userId = CurrentUserId;
        var list = await _db.Policies.AsNoTracking()
            .Where(p => p.UserId == userId)
            .OrderBy(p => p.Id)
            .ToListAsync();
        return Ok(list.Select(p => p.ToDto()));
    }

    /// <summary>POST /api/policies: apply for a plan. The policy starts today.</summary>
    [HttpPost]
    public async Task<IActionResult> Apply(ApplyRequest req)
    {
        if (IsAdmin) return Fail("Admin accounts cannot apply for plans.");

        var plan = await _db.Plans.FirstOrDefaultAsync(p => p.Id == req.PlanId);
        if (plan == null || !plan.IsActive) return Fail("This plan is not open for new applications.");

        var userId = CurrentUserId;
        var today = Today;

        var alreadyHeld = await _db.Policies.AnyAsync(p => p.UserId == userId && p.PlanId == plan.Id && p.EndDate >= today);
        if (alreadyHeld) return Fail("You already hold this plan.");

        var policy = new Policy
        {
            // Temporary unique value. The real number needs the generated id, so it is set after the first save.
            PolicyNumber = Guid.NewGuid().ToString("N"),
            UserId = userId,
            PlanId = plan.Id,
            StartDate = today,
            EndDate = today.AddDays(plan.DurationDays - 1)
        };
        _db.Policies.Add(policy);
        await _db.SaveChangesAsync();

        policy.PolicyNumber = $"LIK-{today.Year}-{policy.Id:D5}";
        await _db.SaveChangesAsync();

        return Ok(policy.ToDto());
    }
}
