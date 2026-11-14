using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Sos.Infra.Persistence;

// Usada pelas ferramentas EF, sem iniciar o servidor HTTP.
public sealed class SosDbContextFactory : IDesignTimeDbContextFactory<SosDbContext>
{
    public SosDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<SosDbContext>()
            .UseNpgsql("Host=127.0.0.1;Port=55432;Database=sos_transito_dev;Username=sos_owner",
                postgres => postgres.UseNetTopologySuite())
            .Options;
        // A senha real é passada por --connection em scripts/migrar.ps1.
        return new SosDbContext(options);
    }
}
