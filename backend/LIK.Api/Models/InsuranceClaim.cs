namespace LIK.Api.Models;

public static class ClaimStatus
{
    public const string Submitted = "Submitted";
    public const string UnderReview = "Under Review";
    public const string Approved = "Approved";
    public const string Rejected = "Rejected";

    public static readonly string[] All = { Submitted, UnderReview, Approved, Rejected };
}

/// <summary>Entity: Claim. Named InsuranceClaim so it does not clash with System.Security.Claims.Claim.</summary>
public class InsuranceClaim
{
    public int Id { get; set; }
    public string ClaimNumber { get; set; } = "";

    public int PolicyId { get; set; }
    public Policy? Policy { get; set; }

    public int UserId { get; set; }
    public AppUser? User { get; set; }

    public DateOnly IncidentDate { get; set; }
    public string Description { get; set; } = "";
    public long Amount { get; set; }

    /// <summary>Only the file name is stored. Uploading the file itself is a possible next step.</summary>
    public string DocumentName { get; set; } = "";

    public string Status { get; set; } = ClaimStatus.Submitted;
    public string Remarks { get; set; } = "";
    public DateOnly CreatedOn { get; set; }

    public List<ClaimEvent> Events { get; set; } = new();
}

/// <summary>One row per status change, shown as the status history on the claim page.</summary>
public class ClaimEvent
{
    public int Id { get; set; }

    public int ClaimId { get; set; }
    public InsuranceClaim? Claim { get; set; }

    public string Status { get; set; } = "";
    public string Note { get; set; } = "";
    public DateOnly OccurredOn { get; set; }
}
