using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sos.Infra.Persistence;

namespace Sos.Api.Features.Catalogo;

[ApiController]
[Route("api/servicos")]
public sealed class CatalogoController(SosDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ServicoResponse>>> Listar(
        CancellationToken cancellationToken)
    {
        var servicos = await db.Servicos
            .AsNoTracking()
            .Where(s => s.Ativo)
            .OrderBy(s => s.Id)
            .Select(s => new ServicoResponse(s.Id, s.Nome, s.Descricao))
            .ToListAsync(cancellationToken);
        return Ok(servicos);
    }
}
