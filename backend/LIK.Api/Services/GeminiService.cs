using System.Text;
using System.Text.Json;

namespace LIK.Api.Services;

/// <summary>One message in the conversation. Role is "user" or "model".</summary>
public record ChatTurn(string Role, string Text);

/// <summary>Raised when the Gemini API cannot answer. UserMessage is safe to show on the website.</summary>
public class GeminiException : Exception
{
    public string UserMessage { get; }

    public GeminiException(string userMessage, string details) : base(details)
    {
        UserMessage = userMessage;
    }
}

/// <summary>
/// Sends a conversation to the Google Gemini API and returns the reply text.
/// The API key stays on the server. It is never sent to the browser.
/// </summary>
public class GeminiService
{
    private const string BaseUrl = "https://generativelanguage.googleapis.com/v1beta/models/";

    private readonly HttpClient _http;
    private readonly IConfiguration _config;

    public GeminiService(HttpClient http, IConfiguration config)
    {
        _http = http;
        _config = config;
    }

    public bool IsConfigured
    {
        get
        {
            var key = _config["Gemini:ApiKey"];
            return !string.IsNullOrWhiteSpace(key) && key != "Enter your API key here";
        }
    }

    public async Task<string> ChatAsync(string systemPrompt, IReadOnlyList<ChatTurn> turns, CancellationToken ct)
    {
        var apiKey = _config["Gemini:ApiKey"];
        var model = _config["Gemini:Model"];
        if (string.IsNullOrWhiteSpace(model)) model = "gemini-3.5-flash-lite";

        var body = new
        {
            systemInstruction = new { parts = new[] { new { text = systemPrompt } } },
            contents = turns.Select(t => new { role = t.Role, parts = new[] { new { text = t.Text } } }).ToArray(),
            generationConfig = new { temperature = 0.4, maxOutputTokens = 4096 }
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, $"{BaseUrl}{model}:generateContent");
        request.Headers.Add("x-goog-api-key", apiKey);
        request.Content = JsonContent.Create(body);

        HttpResponseMessage response;
        try
        {
            response = await _http.SendAsync(request, ct);
        }
        catch (HttpRequestException ex)
        {
            throw new GeminiException("The assistant could not reach the Gemini service. Check the internet connection and try again.", ex.Message);
        }
        catch (TaskCanceledException ex) when (!ct.IsCancellationRequested)
        {
            throw new GeminiException("The assistant took too long to answer. Please try again.", ex.Message);
        }

        using (response)
        {
            var json = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                var userMessage = (int)response.StatusCode switch
                {
                    400 or 403 => "The Gemini API key or model name was rejected. Check the Gemini settings in the backend.",
                    404 => "The Gemini model name was not found. Check Gemini:Model in appsettings.json.",
                    429 => "The assistant is busy right now. Wait a moment and try again.",
                    _ => "The assistant could not answer right now. Please try again."
                };
                throw new GeminiException(userMessage, $"Gemini returned {(int)response.StatusCode}: {Truncate(json, 500)}");
            }

            return ExtractText(json);
        }
    }

    private static string ExtractText(string json)
    {
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        if (root.TryGetProperty("candidates", out var candidates) &&
            candidates.ValueKind == JsonValueKind.Array && candidates.GetArrayLength() > 0)
        {
            var candidate = candidates[0];
            if (candidate.TryGetProperty("content", out var content) &&
                content.TryGetProperty("parts", out var parts) &&
                parts.ValueKind == JsonValueKind.Array)
            {
                var text = new StringBuilder();
                foreach (var part in parts.EnumerateArray())
                {
                    // Skip reasoning parts that some models return.
                    if (part.TryGetProperty("thought", out var thought) && thought.ValueKind == JsonValueKind.True) continue;
                    if (part.TryGetProperty("text", out var t) && t.ValueKind == JsonValueKind.String) text.Append(t.GetString());
                }

                var result = text.ToString().Trim();
                if (result.Length > 0) return result;
            }
        }

        throw new GeminiException("The assistant could not answer that question. Try rephrasing it.", $"No text in Gemini response: {Truncate(json, 500)}");
    }

    private static string Truncate(string s, int max) => s.Length <= max ? s : s.Substring(0, max);
}
