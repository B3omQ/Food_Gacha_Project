using FoodCaseOpener.Api.Data;
using FoodCaseOpener.Api.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Koyeb sets PORT env variable — bind ASP.NET to it
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port))
{
    builder.WebHost.UseUrls($"http://+:{port}");
}

// Add services to the container.
// Support Neon DATABASE_URL (PostgreSQL URI), ADO.NET connection string, or local fallback
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
if (string.IsNullOrEmpty(connectionString) && !string.IsNullOrEmpty(databaseUrl))
{
    if (databaseUrl.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
        databaseUrl.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
    {
        // Parse PostgreSQL URI → ADO.NET connection string for Npgsql
        var uri = new Uri(databaseUrl);
        var colonIndex = uri.UserInfo.IndexOf(':');
        var username = colonIndex >= 0 ? Uri.UnescapeDataString(uri.UserInfo[..colonIndex]) : uri.UserInfo;
        var password = colonIndex >= 0 ? Uri.UnescapeDataString(uri.UserInfo[(colonIndex + 1)..]) : "";
        var dbName = uri.AbsolutePath.TrimStart('/');
        var portNum = uri.Port > 0 ? uri.Port : 5432;

        connectionString = $"Host={uri.Host};Port={portNum};Database={dbName};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true";
    }
    else
    {
        connectionString = databaseUrl;
    }
}

connectionString ??= "Host=localhost;Port=5433;Database=food_case_opener;Username=postgres;Password=postgres";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddScoped<ICaseOpeningService, CaseOpeningService>();

builder.Services.AddControllers();
builder.Services.AddOpenApi();

// CORS configuration for Frontend
var allowedOrigins = new List<string>
{
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001"
};

// Support additional origins from environment variable (comma-separated or '*')
var extraOrigins = builder.Configuration["ALLOWED_ORIGINS"]
    ?? Environment.GetEnvironmentVariable("ALLOWED_ORIGINS");
if (!string.IsNullOrEmpty(extraOrigins))
{
    allowedOrigins.AddRange(extraOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        if (extraOrigins?.Trim() == "*")
        {
            policy.AllowAnyOrigin()
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
        else
        {
            policy.WithOrigins(allowedOrigins.ToArray())
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowFrontend");

// Auto-migration & Seeding on startup if database is accessible
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        if (context.Database.IsRelational())
        {
            await context.Database.MigrateAsync();
            await SeedData.InitializeAsync(context);
            logger.LogInformation("Database migrated and seeded successfully.");
        }
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Could not automatically migrate or seed database on startup. Ensure PostgreSQL is running.");
    }
}

// Only redirect to HTTPS in development — Render handles TLS at the proxy level
if (app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthorization();

app.MapControllers();

app.Run();
