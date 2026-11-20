using Microsoft.AspNetCore.Mvc;

namespace Sos.Api.Features.Administracao;

// Rotas da auditoria do painel admin. A lógica fica em AuditoriaService.
[ApiController]
[Route("api/admin/auditoria")]
public sealed class AuditoriaController(AuditoriaService service) : ControllerBase
{
    // GET /api/admin/auditoria?area=bloqueio&quem=Cristian&dias=7&limite=500
    [HttpGet]
    public async Task<ActionResult<List<EventoAuditoriaResponse>>> Listar([FromQuery] FiltroAuditoria filtro, CancellationToken ct) =>
        Ok(await service.Listar(filtro, ct));

    // POST /api/admin/auditoria → registra um evento (data e hora definidas pelo servidor)
    [HttpPost]
    public async Task<ActionResult<EventoAuditoriaResponse>> Registrar(RegistrarEventoRequest req, CancellationToken ct)
    {
        try
        {
            var e = await service.Registrar(req, ct);
            return Created($"/api/admin/auditoria/{e.Id}", e);
        }
        catch (ArgumentException ex)
        {
            return Problem(ex.Message, statusCode: StatusCodes.Status400BadRequest, title: "Evento inválido");
        }
    }
}
