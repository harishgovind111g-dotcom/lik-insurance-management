namespace LIK.Api.Models;

/// <summary>Entity: Policy. A policy is created when a user applies for a plan.</summary>
public class Policy
{
    public int Id { get; set; }
    public string PolicyNumber { get; set; } = "";

    public int UserId { get; set; }
    public AppUser? User { get; set; }

    public int PlanId { get; set; }
    public InsurancePlan? Plan { get; set; }

    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }

    public List<InsuranceClaim> Claims { get; set; } = new();
}
