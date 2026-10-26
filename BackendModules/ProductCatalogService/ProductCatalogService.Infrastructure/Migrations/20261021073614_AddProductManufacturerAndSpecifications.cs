using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProductCatalogService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProductManufacturerAndSpecifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Manufacturer",
                table: "products",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Specifications",
                table: "products",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Manufacturer",
                table: "products");

            migrationBuilder.DropColumn(
                name: "Specifications",
                table: "products");
        }
    }
}
