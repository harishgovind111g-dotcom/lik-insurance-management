using LIK.Api.Data;
using LIK.Api.Dtos;
using LIK.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LIK.Api.Controllers;

/// <summary>Admin-only endpoints. Requires a JWT whose role is Admin.</summary>
[ApiController]
[Authorize(Roles = Roles.Admin)]
[Route("api/admin")]
public class AdminController : ApiBase
{
    private readonly AppDbContext _db;

    public AdminController(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>GET /api/admin/users</summary>
    [HttpGet("users")]
    public async Task<IActionResult> Users()
    {
        var list = await _db.Users.AsNoTracking().OrderBy(u => u.Id).ToListAsync();
        return Ok(list.Select(u => u.ToDto()));
    }

    /// <summary>GET /api/admin/policies: every policy.</summary>
    [HttpGet("policies")]
    public async Task<IActionResult> Policies()
    {
        var list = await _db.Policies.AsNoTracking().OrderBy(p => p.Id).ToListAsync();
        return Ok(list.Select(p => p.ToDto()));
    }

    /// <summary>GET /api/admin/claims: every claim, newest first.</summary>
    [HttpGet("claims")]
    public async Task<IActionResult> Claims()
    {
        var list = await _db.Claims.AsNoTracking()
            .Include(c => c.Events)
            .OrderByDescending(c => c.Id)
            .ToListAsync();
        return Ok(list.Select(c => c.ToDto()));
    }

    /// <summary>PUT /api/admin/claims/3/status: approve, reject or move a claim to review.</summary>
    [HttpPut("claims/{id:int}/status")]
    public async Task<IActionResult> UpdateClaimStatus(int id, UpdateClaimStatusRequest req)
    {
        var claim = await _db.Claims.Include(c => c.Events).FirstOrDefaultAsync(c => c.Id == id);
        if (claim == null) return Missing("Claim not found.");

        if (!ClaimStatus.All.Contains(req.Status)) return Fail("Choose a valid status.");

        var remarks = (req.Remarks ?? "").Trim();
        if (req.Status == ClaimStatus.Rejected && remarks.Length == 0)
            return Fail("Add a remark that explains the rejection.");
        if (req.Status == claim.Status && remarks.Length == 0)
            return Fail("Change the status or add a remark to save an update.");

        claim.Status = req.Status;
        if (remarks.Length > 0) claim.Remarks = remarks;
        claim.Events.Add(new ClaimEvent { Status = req.Status, Note = remarks, OccurredOn = Today });

        await _db.SaveChangesAsync();
        return Ok(claim.ToDto());
    }

    /// <summary>POST /api/admin/plans: add a plan to a category.</summary>
    [HttpPost("plans")]
    public async Task<IActionResult> CreatePlan(CreatePlanRequest req)
    {
        var slug = req.Category.Trim().ToLowerInvariant();
        var category = await _db.Categories.FirstOrDefaultAsync(c => c.Slug == slug);
        if (category == null) return Fail("Choose a valid category.");

        var benefits = req.Benefits.Select(b => b.Trim()).Where(b => b.Length > 0).ToArray();

        if (req.Provider.Trim().Length == 0) return Fail("Enter the provider name.");
        if (req.Name.Trim().Length == 0) return Fail("Enter the plan name.");
        if (req.Premium <= 0) return Fail("Enter a premium above zero.");
        if (req.Cover <= 0) return Fail("Enter a cover amount above zero.");
        if (req.Days <= 0) return Fail("Enter the number of days.");
        if (benefits.Length == 0) return Fail("Add at least one benefit.");

        var plan = new InsurancePlan
        {
            CategoryId = category.Id,
            Provider = req.Provider.Trim(),
            Name = req.Name.Trim(),
            Premium = req.Premium,
            CoverAmount = req.Cover,
            DurationDays = req.Days,
            PremiumPeriod = slug == "travel" ? "/trip" : "/year",
            IsPopular = false,
            IsActive = true,
            Benefits = string.Join("\n", benefits),
            Exclusions = ""
        };
        _db.Plans.Add(plan);
        await _db.SaveChangesAsync();

        plan.Category = category;
        return Ok(plan.ToDto());
    }

    /// <summary>PUT /api/admin/plans/5: edit an existing plan.</summary>
    [HttpPut("plans/{id:int}")]
    public async Task<IActionResult> UpdatePlan(int id, UpdatePlanRequest req)
    {
        var plan = await _db.Plans.Include(p => p.Category).FirstOrDefaultAsync(p => p.Id == id);
        if (plan == null) return Missing("Plan not found.");

        var benefits = req.Benefits.Select(b => b.Trim()).Where(b => b.Length > 0).ToArray();
        var exclusions = (req.Exclusions ?? Array.Empty<string>()).Select(x => x.Trim()).Where(x => x.Length > 0).ToArray();

        if (req.Provider.Trim().Length == 0) return Fail("Enter the provider name.");
        if (req.Name.Trim().Length == 0) return Fail("Enter the plan name.");
        if (req.Premium <= 0) return Fail("Enter a premium above zero.");
        if (req.Cover <= 0) return Fail("Enter a cover amount above zero.");
        if (req.Days <= 0) return Fail("Enter the number of days.");
        if (benefits.Length == 0) return Fail("Add at least one benefit.");

        plan.Provider = req.Provider.Trim();
        plan.Name = req.Name.Trim();
        plan.Premium = req.Premium;
        plan.CoverAmount = req.Cover;
        plan.DurationDays = req.Days;
        plan.Benefits = string.Join("\n", benefits);
        plan.Exclusions = string.Join("\n", exclusions);
        plan.IsPopular = req.Popular;

        await _db.SaveChangesAsync();
        return Ok(plan.ToDto());
    }

    /// <summary>PUT /api/admin/plans/5/toggle: hide a plan from customers or show it again.</summary>
    [HttpPut("plans/{id:int}/toggle")]
    public async Task<IActionResult> TogglePlan(int id)
    {
        var plan = await _db.Plans.Include(p => p.Category).FirstOrDefaultAsync(p => p.Id == id);
        if (plan == null) return Missing("Plan not found.");

        plan.IsActive = !plan.IsActive;
        await _db.SaveChangesAsync();
        return Ok(plan.ToDto());
    }
}
