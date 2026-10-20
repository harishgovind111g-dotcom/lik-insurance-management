namespace LIK.Api.Models;

/// <summary>Entity: InsuranceCategory (Health, Life, Motor, Travel, Home).</summary>
public class InsuranceCategory
{
    public int Id { get; set; }

    /// <summary>Short key used by the frontend, for example "health".</summary>
    public string Slug { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string ImageUrl { get; set; } = "";

    public List<InsurancePlan> Plans { get; set; } = new();
}
