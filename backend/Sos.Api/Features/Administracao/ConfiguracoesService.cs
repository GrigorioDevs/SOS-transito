using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Sos.Domain.Administracao;
using Sos.Infra.Persistence;

namespace Sos.Api.Features.Administracao;

// Outra pessoa salvou uma versão mais nova depois que o admin abriu a tela.
public sealed class ConflitoDeVersaoException(int versaoAtual)
    : Exception($"A configuração foi alterada por outra pessoa (versão atual: {versaoAtual}). Recarregue a página.");

// Lógica das configurações. Cada salvamento grava uma versão nova (as antigas formam o histórico).
public sealed class ConfiguracoesService(SosDbContext db, TimeProvider relogio)
{
    // null = nunca salvo: o front usa os valores padrão (versão 1).
    public async Task<ConfiguracaoResponse?> BuscarAtual(CancellationToken ct)
    {
        var c = await db.ConfiguracaoVersoes.AsNoTracking()
            .OrderByDescending(v => v.Versao)
            .FirstOrDefaultAsync(ct);
        return c is null ? null : ParaResposta(c);
    }

    public async Task<List<ConfiguracaoResponse>> ListarVersoes(int limite, CancellationToken ct)
    {
        var linhas = await db.ConfiguracaoVersoes.AsNoTracking()
            .OrderByDescending(v => v.Versao)
            .Take(limite)
            .ToListAsync(ct);
        return linhas.Select(ParaResposta).ToList();
    }

    public async Task<ConfiguracaoResponse> Salvar(SalvarConfiguracaoRequest req, CancellationToken ct)
    {
        if (req.Dados.ValueKind != JsonValueKind.Object)
            throw new ArgumentException("Dados precisa ser um objeto JSON com a configuração.");

        var atual = await db.ConfiguracaoVersoes.MaxAsync(v => (int?)v.Versao, ct) ?? ConfiguracaoVersao.VersaoPadrao;
        if (req.VersaoBase != atual) throw new ConflitoDeVersaoException(atual);

        var nova = new ConfiguracaoVersao
        {
            Versao = atual + 1,
            Esquema = req.Esquema,
            Dados = req.Dados.GetRawText(),
            SalvoEm = relogio.GetUtcNow(),
            SalvoPor = req.SalvoPor.Trim(),
        };
        db.ConfiguracaoVersoes.Add(nova);
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            // Corrida: outro salvamento gravou a mesma versão entre a leitura e a gravação (chave primária).
            throw new ConflitoDeVersaoException(atual + 1);
        }
        return ParaResposta(nova);
    }

    private static ConfiguracaoResponse ParaResposta(ConfiguracaoVersao c)
    {
        using var doc = JsonDocument.Parse(c.Dados);
        return new ConfiguracaoResponse(c.Versao, c.Esquema, c.SalvoEm, c.SalvoPor, doc.RootElement.Clone());
    }
}
