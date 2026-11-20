using Microsoft.EntityFrameworkCore;
using Sos.Domain.Administracao;
using Sos.Domain.Catalogo;

namespace Sos.Infra.Persistence;

public sealed class SosDbContext(DbContextOptions<SosDbContext> options)
    : DbContext(options)
{
    public DbSet<Servico> Servicos => Set<Servico>();
    public DbSet<ConfiguracaoVersao> ConfiguracaoVersoes => Set<ConfiguracaoVersao>();
    public DbSet<EventoAuditoria> EventosAuditoria => Set<EventoAuditoria>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasPostgresExtension("postgis");
        var servico = modelBuilder.Entity<Servico>();
        servico.ToTable("servicos");
        servico.HasKey(s => s.Id);
        servico.Property(s => s.Nome).HasMaxLength(80).IsRequired();
        servico.Property(s => s.Descricao).HasMaxLength(250).IsRequired();
        servico.HasIndex(s => s.Nome).IsUnique();
        servico.HasData(
            new Servico { Id = 1, Nome = "Borracheiro", Descricao = "Troca por estepe e reparo de pneu no local." },
            new Servico { Id = 2, Nome = "Elétrica", Descricao = "Auxílio para bateria descarregada e pane elétrica." },
            new Servico { Id = 3, Nome = "Pane seca", Descricao = "Entrega de combustível compatível com o veículo." },
            new Servico { Id = 4, Nome = "Guincho", Descricao = "Reboque para um destino informado pelo cliente." },
            new Servico { Id = 5, Nome = "Chaveiro", Descricao = "Abertura de veículo com verificação de propriedade." }
        );

        var config = modelBuilder.Entity<ConfiguracaoVersao>();
        config.ToTable("configuracoes_versoes");
        // A chave é o número da versão: dois admins salvando ao mesmo tempo não criam a mesma versão.
        config.HasKey(c => c.Versao);
        config.Property(c => c.Versao).ValueGeneratedNever();
        config.Property(c => c.Dados).HasColumnType("jsonb").IsRequired();
        config.Property(c => c.SalvoPor).HasMaxLength(80).IsRequired();

        var evento = modelBuilder.Entity<EventoAuditoria>();
        evento.ToTable("auditoria_eventos", t => t.HasCheckConstraint("CK_auditoria_eventos_Area",
            "\"Area\" IN ('denuncia', 'usuario', 'bloqueio', 'avaliacao', 'sistema', 'configuracao')"));
        evento.HasKey(e => e.Id);
        evento.Property(e => e.Quem).HasMaxLength(80).IsRequired();
        evento.Property(e => e.Area).HasMaxLength(20).IsRequired();
        evento.Property(e => e.Acao).HasMaxLength(200).IsRequired();
        evento.Property(e => e.Alvo).HasMaxLength(200);
        evento.Property(e => e.Motivo).HasMaxLength(2000);
        evento.Property(e => e.Ref).HasMaxLength(60);
        evento.HasIndex(e => e.Quando);
    }
}
