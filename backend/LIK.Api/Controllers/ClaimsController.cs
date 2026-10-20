using LIK.Api.Data;
using LIK.Api.Dtos;
using LIK.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LIK.Api.Controllers;

/// <summary>A logged-in user's claims: submit a claim and track its status.</summary>
[ApiController]
[Authorize]
[Route("api/claims")]
public class ClaimsController : ApiBase
{
    private static readonly string[] AllowedExtensions = { ".pdf", ".jpg", ".jpeg", ".png" };
    private const long MaxFileBytes = 5 * 1024 * 1024;

    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;

    public ClaimsController(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    /// <summary>Uploaded claim documents are saved in the "uploads" folder as claim-{id}.pdf / .jpg / .png.</summary>
    private string UploadFolder => Path.Combine(_env.ContentRootPath, "uploads");

    private string? FindDocument(int claimId) =>
        Directory.Exists(UploadFolder)
            ? Directory.GetFiles(UploadFolder, $"claim-{claimId}.*").FirstOrDefault()
            : null;

    /// <summary>POST /api/claims/3/document: the customer uploads a PDF or photo for their claim.</summary>
    [HttpPost("{id:int}/document")]
    [RequestSizeLimit(MaxFileBytes + 200_000)]
    public async Task<IActionResult> UploadDocument(int id, IFormFile? file)
    {
        var claim = await _db.Claims.Include(c => c.Events).FirstOrDefaultAsync(c => c.Id == id && c.UserId == CurrentUserId);
        if (claim == null) return Missing("Claim not found.");

        if (file == null || file.Length == 0) return Fail("Choose a file to upload.");
        if (file.Length > MaxFileBytes) return Fail("The file must be 5 MB or smaller.");

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext)) return Fail("Only PDF, JPG and PNG files are allowed.");

        Directory.CreateDirectory(UploadFolder);
        var old = FindDocument(id);
        if (old != null) System.IO.File.Delete(old);

        var path = Path.Combine(UploadFolder, $"claim-{id}{ext}");
        await using (var stream = System.IO.File.Create(path))
        {
            await file.CopyToAsync(stream);
        }

        claim.DocumentName = Path.GetFileName(file.FileName);
        await _db.SaveChangesAsync();
        return Ok(claim.ToDto());
    }

    /// <summary>GET /api/claims/3/document: open the uploaded file. Owner or admin only.</summary>
    [HttpGet("{id:int}/document")]
    public async Task<IActionResult> GetDocument(int id)
    {
        var claim = await _db.Claims.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id);
        if (claim == null || (!IsAdmin && claim.UserId != CurrentUserId)) return Missing("Claim not found.");

        var path = FindDocument(id);
        if (path == null) return Missing("No file has been uploaded for this claim.");

        var contentType = Path.GetExtension(path).ToLowerInvariant() switch
        {
            ".pdf" => "application/pdf",
            ".png" => "image/png",
            _ => "image/jpeg"
        };
        return PhysicalFile(path, contentType);
    }

    /// <summary>GET /api/claims: claims of the logged-in user, newest first.</summary>
    [HttpGet]
    public async Task<IActionResult> Mine()
    {
        var userId = CurrentUserId;
        var list = await _db.Claims.AsNoTracking()
            .Include(c => c.Events)
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.Id)
            .ToListAsync();
        return Ok(list.Select(c => c.ToDto()));
    }

    /// <summary>GET /api/claims/3: one claim. Customers see only their own; admins see any.</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var claim = await _db.Claims.AsNoTracking()
            .Include(c => c.Events)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (claim == null || (!IsAdmin && claim.UserId != CurrentUserId))
            return Missing("Claim not found.");

        return Ok(claim.ToDto());
    }

    /// <summary>POST /api/claims: submit a new claim with status Submitted.</summary>
    [HttpPost]
    public async Task<IActionResult> Create(CreateClaimRequest req)
    {
        var userId = CurrentUserId;
        var today = Today;

        var policy = await _db.Policies
            .Include(p => p.Plan)
            .FirstOrDefaultAsync(p => p.Id == req.PolicyId && p.UserId == userId);

        if (policy == null || policy.Plan == null) return Fail("Choose one of your own policies.");
        if (policy.EndDate < today || policy.StartDate > today) return Fail("Claims can only be filed against an active policy.");

        if (req.IncidentDate > today) return Fail("The incident date cannot be in the future.");
        if (req.IncidentDate < policy.StartDate) return Fail($"The incident must fall after the policy start date, {policy.StartDate:dd MMM yyyy}.");

        if (req.Amount <= 0) return Fail("Enter the amount you are claiming.");
        if (req.Amount > policy.Plan.CoverAmount) return Fail($"The amount cannot exceed the cover of {policy.Plan.CoverAmount:N0} rupees.");

        var description = req.Description.Trim();
        if (description.Length < 20) return Fail("Describe what happened in at least 20 characters.");

        var claim = new InsuranceClaim
        {
            // Temporary unique value. The real number needs the generated id, so it is set after the first save.
            ClaimNumber = Guid.NewGuid().ToString("N"),
            PolicyId = policy.Id,
            UserId = userId,
            IncidentDate = req.IncidentDate,
            Amount = req.Amount,
            Description = description,
            DocumentName = (req.DocumentName ?? "").Trim(),
            Status = ClaimStatus.Submitted,
            Remarks = "",
            CreatedOn = today
        };
        claim.Events.Add(new ClaimEvent { Status = ClaimStatus.Submitted, Note = "", OccurredOn = today });

        _db.Claims.Add(claim);
        await _db.SaveChangesAsync();

        claim.ClaimNumber = $"CLM-{1000 + claim.Id}";
        await _db.SaveChangesAsync();

        return Ok(claim.ToDto());
    }
}
