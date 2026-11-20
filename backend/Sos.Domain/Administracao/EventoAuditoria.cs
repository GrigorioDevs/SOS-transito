namespace Sos.Domain.Administracao;

// Registro de auditoria: quem fez o quê, quando e por quê. Só é inserido, nunca alterado.
public sealed class EventoAuditoria
{
    public static readonly IReadOnlySet<string> Areas =
        new HashSet<string> { "denuncia", "usuario", "bloqueio", "avaliacao", "sistema", "configuracao" };

    public long Id { get; set; }
    public DateTimeOffset Quando { get; set; }
    public string Quem { get; set; } = string.Empty;
    public string Area { get; set; } = string.Empty;
    public string Acao { get; set; } = string.Empty;
    public string? Alvo { get; set; }
    public string? Motivo { get; set; }
    public string? Ref { get; set; }
}
