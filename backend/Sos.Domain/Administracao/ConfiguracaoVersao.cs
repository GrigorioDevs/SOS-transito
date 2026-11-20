namespace Sos.Domain.Administracao;

// Uma versão salva das configurações do painel admin.
// Cada salvamento cria uma linha nova (nunca altera as antigas): o histórico fica completo.
// A versão 1 é o padrão do sistema e não é gravada; a primeira versão salva é a 2.
public sealed class ConfiguracaoVersao
{
    public const int VersaoPadrao = 1;

    public int Versao { get; set; }
    public int Esquema { get; set; }       // formato do JSON (ESQUEMA_CONFIG do front)
    public string Dados { get; set; } = "{}"; // configuração completa em JSON (jsonb)
    public DateTimeOffset SalvoEm { get; set; }
    public string SalvoPor { get; set; } = string.Empty;
}
