namespace LIK.Api.Models;

/// <summary>Entity: InsurancePlan. Money values are whole rupees.</summary>
public class InsurancePlan
{
    public int Id { get; set; }

    public int CategoryId { get; set; }
    public InsuranceCategory? Category { get; set; }

    public string Provider { get; set; } = "";
    public string Name { get; set; } = "";

    public long Premium { get; set; }
    public long CoverAmount { get; set; }
    public int DurationDays { get; set; }

    /// <summary>Shown after the premium, for example "/year" or "/trip".</summary>
    public string PremiumPeriod { get; set; } = "/year";

    public bool IsPopular { get; set; }

    /// <summary>Hidden plans cannot be applied for, but existing policies keep working.</summary>
    public bool IsActive { get; set; } = true;

    /// <summary>One benefit per line.</summary>
    public string Benefits { get; set; } = "";

    /// <summary>One exclusion per line.</summary>
    public string Exclusions { get; set; } = "";
}
