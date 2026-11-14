using Microsoft.EntityFrameworkCore;
using Sos.Infra.Persistence;

var builder = WebApplication.CreateBuilder(args);
// Protege contra publicar acidentalmente esta etapa sem autenticacao.
if (!builder.Environment.IsDevelopment())
    throw new InvalidOperationException("Este kit inicial executa somente em Development.");

var connection = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("Configure ConnectionStrings:Default com User Secrets.");
builder.Services.AddDbContext<SosDbContext>(options =>
    options.UseNpgsql(connection, postgres => postgres.UseNetTopologySuite()));
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();

var app = builder.Build();
app.UseExceptionHandler();
// Sem CORS nesta etapa: o navegador usa /api pelo proxy local do Vite.
app.MapOpenApi();
app.MapGet("/health/live", () => Results.Ok(new { status = "online" }));
app.MapGet("/health/ready", async (SosDbContext db, CancellationToken ct) =>
    await db.Database.CanConnectAsync(ct)
        ? Results.Ok(new { status = "banco acessivel" })
        : Results.StatusCode(StatusCodes.Status503ServiceUnavailable));
app.MapControllers();
app.Run();
