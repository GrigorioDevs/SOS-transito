using Microsoft.EntityFrameworkCore;
using Sos.Domain.Administracao;
using Sos.Infra.Persistence;

namespace Sos.Api.Features.Administracao;

// Lógica da auditoria: listar com filtros e registrar eventos novos (só inserção).
public sealed class AuditoriaService(SosDbContext db, TimeProvider relogio)
{
    public const int LimitePadrao = 500;
    public const int LimiteMaximo = 2000;

    public async Task<List<EventoAuditoriaResponse>> Listar(FiltroAuditoria f, CancellationToken ct)
    {
        var consulta = db.EventosAuditoria.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(f.Area) && f.Area != "todas") consulta = consulta.Where(e => e.Area == f.Area);
        if (!string.IsNullOrWhiteSpace(f.Quem) && f.Quem != "todos") consulta = consulta.Where(e => e.Quem == f.Quem);
        if (f.Dias is > 0)
        {
            var desde = relogio.GetUtcNow().AddDays(-Math.Min(f.Dias.Value, 3650));
            consulta = consulta.Where(e => e.Quando >= desde);
        }
        var limite = Math.Clamp(f.Limite ?? LimitePadrao, 1, LimiteMaximo);
        return await consulta
            .OrderByDescending(e => e.Quando).ThenByDescending(e => e.Id)
            .Take(limite)
            .Select(e => new EventoAuditoriaResponse(e.Id, e.Quando, e.Quem, e.Area, e.Acao, e.Alvo, e.Motivo, e.Ref))
            .ToListAsync(ct);
    }

    public async Task<EventoAuditoriaResponse> Registrar(RegistrarEventoRequest req, CancellationToken ct)
    {
        if (!EventoAuditoria.Areas.Contains(req.Area))
            throw new ArgumentException($"Área inválida: {req.Area}.");

        var e = new EventoAuditoria
        {
            Quando = relogio.GetUtcNow(),
            Quem = req.Quem.Trim(),
            Area = req.Area,
            Acao = req.Acao.Trim(),
            Alvo = Vazio(req.Alvo),
            Motivo = Vazio(req.Motivo),
            Ref = Vazio(req.Ref),
        };
        db.EventosAuditoria.Add(e);
        await db.SaveChangesAsync(ct);
        return new EventoAuditoriaResponse(e.Id, e.Quando, e.Quem, e.Area, e.Acao, e.Alvo, e.Motivo, e.Ref);
    }

    private static string? Vazio(string? v) => string.IsNullOrWhiteSpace(v) ? null : v.Trim();
}
