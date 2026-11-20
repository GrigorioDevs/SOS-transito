using System.ComponentModel.DataAnnotations;

namespace Sos.Api.Features.Administracao;

// DTOs: o que entra e o que sai das rotas de auditoria.
public sealed record EventoAuditoriaResponse(
    long Id, DateTimeOffset Quando, string Quem, string Area, string Acao, string? Alvo, string? Motivo, string? Ref);

public sealed record RegistrarEventoRequest(
    [Required, StringLength(80, MinimumLength = 1)] string Quem,
    [Required, StringLength(20)] string Area,
    [Required, StringLength(200, MinimumLength = 1)] string Acao,
    [StringLength(200)] string? Alvo,
    [StringLength(2000)] string? Motivo,
    [StringLength(60)] string? Ref);

public sealed record FiltroAuditoria(string? Area, string? Quem, int? Dias, int? Limite);
