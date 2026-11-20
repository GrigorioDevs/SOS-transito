using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace Sos.Api.Features.Administracao;

// DTOs: o que entra e o que sai das rotas de configuração.
// "Dados" é a configuração inteira do painel (o objeto ConfiguracoesAdmin do front, sem versão/autor).
public sealed record ConfiguracaoResponse(int Versao, int Esquema, DateTimeOffset SalvoEm, string SalvoPor, JsonElement Dados);

public sealed record SalvarConfiguracaoRequest(
    [Range(1, int.MaxValue)] int VersaoBase,   // versão que o admin abriu para editar
    [Range(1, 1000)] int Esquema,
    [Required, StringLength(80, MinimumLength = 1)] string SalvoPor,
    JsonElement Dados);
