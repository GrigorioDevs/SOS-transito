using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Sos.Infra.Migrations
{
    /// <inheritdoc />
    public partial class InicialCatalogo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:postgis", ",,");

            migrationBuilder.CreateTable(
                name: "servicos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nome = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Descricao = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_servicos", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "servicos",
                columns: new[] { "Id", "Ativo", "Descricao", "Nome" },
                values: new object[,]
                {
                    { 1, true, "Troca por estepe e reparo de pneu no local.", "Borracheiro" },
                    { 2, true, "Auxílio para bateria descarregada e pane elétrica.", "Elétrica" },
                    { 3, true, "Entrega de combustível compatível com o veículo.", "Pane seca" },
                    { 4, true, "Reboque para um destino informado pelo cliente.", "Guincho" },
                    { 5, true, "Abertura de veículo com verificação de propriedade.", "Chaveiro" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_servicos_Nome",
                table: "servicos",
                column: "Nome",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "servicos");
        }
    }
}
