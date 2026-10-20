using LIK.Api.Data;
using LIK.Api.Dtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LIK.Api.Controllers;

/// <summary>Public endpoints: anyone can browse categories and plans.</summary>
[ApiController]
[Route("api")]
public class CatalogController : ApiBase
{
    private readonly AppDbContext _db;

    public CatalogController(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>GET /api/categories</summary>
    [HttpGet("categories")]
    public async Task<IActionResult> Categories()
    {
        var list = await _db.Categories.AsNoTracking().OrderBy(c => c.Id).ToListAsync();
        return Ok(list.Select(c => c.ToDto()));
    }

    /// <summary>
    /// GET /api/plans (optional ?category=health).
    /// Hidden plans are included with active=false so existing policies can still show their plan name.
    /// </summary>
    [HttpGet("plans")]
    public async Task<IActionResult> Plans([FromQuery] string? category)
    {
        var query = _db.Plans.AsNoTracking().Include(p => p.Category).AsQueryable();

        if (!string.IsNullOrWhiteSpace(category))
        {
            var slug = category.Trim().ToLowerInvariant();
            query = query.Where(p => p.Category!.Slug == slug);
        }

        var list = await query.OrderBy(p => p.Id).ToListAsync();
        return Ok(list.Select(p => p.ToDto()));
    }

    /// <summary>GET /api/plans/5</summary>
    [HttpGet("plans/{id:int}")]
    public async Task<IActionResult> Plan(int id)
    {
        var plan = await _db.Plans.AsNoTracking().Include(p => p.Category).FirstOrDefaultAsync(p => p.Id == id);
        if (plan == null) return Missing("Plan not found.");
        return Ok(plan.ToDto());
    }
}
