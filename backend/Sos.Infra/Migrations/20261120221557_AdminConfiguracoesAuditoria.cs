using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Sos.Infra.Migrations
{
    /// <inheritdoc />
    public partial class AdminConfiguracoesAuditoria : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "auditoria_eventos",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Quando = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Quem = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Area = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Acao = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Alvo = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Motivo = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    Ref = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_auditoria_eventos", x => x.Id);
                    table.CheckConstraint("CK_auditoria_eventos_Area", "\"Area\" IN ('denuncia', 'usuario', 'bloqueio', 'avaliacao', 'sistema', 'configuracao')");
                });

            migrationBuilder.CreateTable(
                name: "configuracoes_versoes",
                columns: table => new
                {
                    Versao = table.Column<int>(type: "integer", nullable: false),
                    Esquema = table.Column<int>(type: "integer", nullable: false),
                    Dados = table.Column<string>(type: "jsonb", nullable: false),
                    SalvoEm = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    SalvoPor = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_configuracoes_versoes", x => x.Versao);
                });

            migrationBuilder.CreateIndex(
                name: "IX_auditoria_eventos_Quando",
                table: "auditoria_eventos",
                column: "Quando");

            // A API usa sos_app (só leitura por padrão). Nestas tabelas ela pode também INSERIR,
            // mas nunca alterar ou apagar: auditoria e histórico de configuração são só de inclusão.
            migrationBuilder.Sql("""
                DO $$
                BEGIN
                  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sos_app') THEN
                    GRANT SELECT, INSERT ON auditoria_eventos, configuracoes_versoes TO sos_app;
                    EXECUTE format('GRANT USAGE ON SEQUENCE %s TO sos_app',
                      pg_get_serial_sequence('auditoria_eventos', 'Id'));
                  END IF;
                END $$;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "auditoria_eventos");

            migrationBuilder.DropTable(
                name: "configuracoes_versoes");
        }
    }
}
