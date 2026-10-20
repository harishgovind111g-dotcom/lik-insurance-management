namespace LIK.Api.Dtos;

// ---------- Requests (what the frontend sends) ----------

public record RegisterRequest(string Name, string Email, string Phone, string Password);
public record LoginRequest(string Email, string Password);
public record UpdateProfileRequest(string Name, string Phone);

public record ApplyRequest(int PlanId);

public record CreateClaimRequest(int PolicyId, DateOnly IncidentDate, long Amount, string Description, string? DocumentName);

public record UpdateClaimStatusRequest(string Status, string? Remarks);

public record CreatePlanRequest(string Category, string Provider, string Name, long Premium, long Cover, int Days, string[] Benefits);

public record UpdatePlanRequest(string Provider, string Name, long Premium, long Cover, int Days, string[] Benefits, string[]? Exclusions, bool Popular);

public record ChatTurnDto(string? Role, string? Text);
public record ChatRequest(string Message, List<ChatTurnDto>? History);

// ---------- Responses (what the API returns) ----------
// Property names are short on purpose: the frontend reads them directly.
// Ids are returned as strings so the frontend can compare them with values from HTML attributes.

public record UserDto(string Id, string Name, string Email, string Phone, string Role, DateOnly Since);

public record AuthResponse(string Token, UserDto User);

public record ChatResponse(string Reply);

public record CategoryDto(string Id, string Name, string Description, string ImageUrl);

public record PlanDto(
    string Id, string Cat, string Provider, string Name,
    long Premium, long Cover, int Days, string Per,
    bool Popular, bool Active, string[] Benefits, string[] Excl);

public record PolicyDto(string Id, string UserId, string PlanId, string Number, DateOnly Start, DateOnly End);

public record ClaimEventDto(string S, DateOnly D, string N);

public record ClaimDto(
    string Id, string No, string UserId, string PolicyId,
    DateOnly Incident, long Amount, DateOnly Created, string Status,
    string Desc, string Doc, string Remarks, List<ClaimEventDto> Events);
