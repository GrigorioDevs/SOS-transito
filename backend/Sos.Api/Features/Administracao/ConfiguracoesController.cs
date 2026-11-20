using Microsoft.AspNetCore.Mvc;

namespace Sos.Api.Features.Administracao;

// Rotas das configurações do painel admin. A lógica fica em ConfiguracoesService.
// Ainda sem login: quem salvou vem no corpo (até existir autenticação de admin).
[ApiController]
[Route("api/admin/configuracoes")]
public sealed class ConfiguracoesController(ConfiguracoesService service) : ControllerBase
{
    // GET /api/admin/configuracoes → versão atual (204 se nunca foi salva: o front usa o padrão)
    [HttpGet]
    public async Task<ActionResult<ConfiguracaoResponse>> Buscar(CancellationToken ct) =>
        await service.BuscarAtual(ct) is { } atual ? Ok(atual) : NoContent();

    // GET /api/admin/configuracoes/versoes → histórico, da mais nova para a mais antiga
    [HttpGet("versoes")]
    public async Task<ActionResult<List<ConfiguracaoResponse>>> Versoes([FromQuery] int limite = 100, CancellationToken ct = default) =>
        Ok(await service.ListarVersoes(Math.Clamp(limite, 1, 500), ct));

    // PUT /api/admin/configuracoes → grava uma versão nova (409 se outra pessoa salvou antes)
    [HttpPut]
    public async Task<ActionResult<ConfiguracaoResponse>> Salvar(SalvarConfiguracaoRequest req, CancellationToken ct)
    {
        try
        {
            return Ok(await service.Salvar(req, ct));
        }
        catch (ConflitoDeVersaoException ex)
        {
            return Problem(ex.Message, statusCode: StatusCodes.Status409Conflict, title: "Conflito de versão");
        }
        catch (ArgumentException ex)
        {
            return Problem(ex.Message, statusCode: StatusCodes.Status400BadRequest, title: "Configuração inválida");
        }
    }
}
