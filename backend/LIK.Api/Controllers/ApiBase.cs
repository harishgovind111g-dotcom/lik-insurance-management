using LIK.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace LIK.Api.Controllers;

/// <summary>Helpers shared by all controllers.</summary>
public abstract class ApiBase : ControllerBase
{
    /// <summary>Id of the logged-in user, read from the "sub" claim in the JWT.</summary>
    protected int CurrentUserId => int.Parse(User.FindFirst("sub")!.Value);

    protected bool IsAdmin => User.IsInRole(Roles.Admin);

    protected static DateOnly Today => DateOnly.FromDateTime(DateTime.Now);

    /// <summary>400 response with a message the frontend shows to the user.</summary>
    protected IActionResult Fail(string message) => BadRequest(new { message });

    protected IActionResult Missing(string message) => NotFound(new { message });
}
