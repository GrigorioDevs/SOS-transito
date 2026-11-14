using Microsoft.EntityFrameworkCore;
using Sos.Domain.Catalogo;

namespace Sos.Infra.Persistence;

public sealed class SosDbContext(DbContextOptions<SosDbContext> options)
    : DbContext(options)
{
    public DbSet<Servico> Servicos => Set<Servico>();

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
    }
}
