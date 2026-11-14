namespace Sos.Domain.Catalogo;

// Representa um tipo de socorro oferecido pela plataforma.
public sealed class Servico
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public bool Ativo { get; set; } = true;
}
