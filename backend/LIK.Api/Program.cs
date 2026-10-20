using System.Text;
using System.Threading.RateLimiting;
using System.Text.Json.Serialization;
using LIK.Api.Data;
using LIK.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ---------- Database: PostgreSQL (connection string is in appsettings.json) ----------
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is missing in appsettings.json.");

builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));

// ---------- JWT authentication and role-based authorization ----------
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key is missing in appsettings.json.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Keep the claim names exactly as written in the token ("sub", "role").
        options.MapInboundClaims = false;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            NameClaimType = "name",
            RoleClaimType = "role",
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddScoped<TokenService>();

// ---------- Gemini chat assistant ----------
builder.Services.AddHttpClient<GeminiService>(client => client.Timeout = TimeSpan.FromSeconds(40));

// Limit each visitor to 15 assistant messages per minute so the API key cannot be drained.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("assistant", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = 15, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
});

// ---------- CORS: lets the React frontend (Vite dev server on port 5173) call this API ----------
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

// ---------- Controllers and Swagger ----------
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Accept numbers sent as strings, for example "5" for an int.
        options.JsonSerializerOptions.NumberHandling = JsonNumberHandling.AllowReadingFromString;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "LIK Insurance API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Log in with POST /api/auth/login, then paste the token here."
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// ---------- Create the database and add sample data on first run ----------
// If the database cannot be reached the API still starts, so the error can be seen at /api/health
// and in the log, instead of the whole site going down.
string dbStatus = "ok";
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        db.Database.EnsureCreated();
        DbSeeder.Seed(db);
        Console.WriteLine("Database ready.");
    }
    catch (Exception ex)
    {
        dbStatus = ex.GetBaseException().Message;
        Console.WriteLine("Could not connect to PostgreSQL: " + dbStatus);
        Console.WriteLine("Check the connection string (appsettings.json, or App Service environment variables on Azure).");
    }
}

var geminiKey = builder.Configuration["Gemini:ApiKey"];
var geminiReady = !string.IsNullOrWhiteSpace(geminiKey) && geminiKey != "Enter your API key here";
Console.WriteLine(geminiReady ? "Gemini chatbot: API key found." : "Gemini chatbot: no API key yet. Add it in appsettings.json to turn on the chatbot.");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("Frontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.MapGet("/", () => Results.Text("LIK Insurance API is running. Check /api/health"));
app.MapGet("/api/health", () => Results.Ok(new { api = "ok", database = dbStatus, gemini = geminiReady ? "key set" : "no key" }));

app.Run();
