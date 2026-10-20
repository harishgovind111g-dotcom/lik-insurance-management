using LIK.Api.Models;

namespace LIK.Api.Dtos;

/// <summary>Converts database entities into the shapes the frontend expects.</summary>
public static class Mapper
{
    public static string[] Lines(string text) =>
        string.IsNullOrWhiteSpace(text)
            ? Array.Empty<string>()
            : text.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    public static UserDto ToDto(this AppUser u) =>
        new(u.Id.ToString(), u.Name, u.Email, u.Phone, u.Role.ToLowerInvariant(), u.CreatedOn);

    public static CategoryDto ToDto(this InsuranceCategory c) =>
        new(c.Slug, c.Name, c.Description, c.ImageUrl);

    /// <summary>Load the Category navigation property before calling this.</summary>
    public static PlanDto ToDto(this InsurancePlan p) =>
        new(p.Id.ToString(), p.Category?.Slug ?? "", p.Provider, p.Name,
            p.Premium, p.CoverAmount, p.DurationDays, p.PremiumPeriod,
            p.IsPopular, p.IsActive, Lines(p.Benefits), Lines(p.Exclusions));

    public static PolicyDto ToDto(this Policy p) =>
        new(p.Id.ToString(), p.UserId.ToString(), p.PlanId.ToString(), p.PolicyNumber, p.StartDate, p.EndDate);

    /// <summary>Load the Events navigation property before calling this.</summary>
    public static ClaimDto ToDto(this InsuranceClaim c) =>
        new(c.Id.ToString(), c.ClaimNumber, c.UserId.ToString(), c.PolicyId.ToString(),
            c.IncidentDate, c.Amount, c.CreatedOn, c.Status,
            c.Description, c.DocumentName, c.Remarks,
            c.Events.OrderBy(e => e.Id).Select(e => new ClaimEventDto(e.Status, e.OccurredOn, e.Note)).ToList());
}
