using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProductCatalogService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProductFamily : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Family",
                table: "products",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Family",
                table: "products");
        }
    }
}
